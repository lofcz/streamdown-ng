import type { Element, Nodes, Parents, Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import type { ComponentType, JSX, ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeSanitize from "rehype-sanitize";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { escapeRawHtml, rehypeRawFallback } from "./rehype/raw-fallback";

export interface ExtraProps {
  node?: Element | undefined;
}

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

export type Components = {
  [Key in keyof JSX.IntrinsicElements]?:
    | ComponentType<JSX.IntrinsicElements[Key] & ExtraProps>
    | keyof JSX.IntrinsicElements;
} & {
  inlineCode?: ComponentType<JSX.IntrinsicElements["code"] & ExtraProps>;
  [key: string]:
    | ComponentType<Record<string, unknown> & ExtraProps>
    | keyof JSX.IntrinsicElements
    | undefined;
};

export interface Options {
  allowElement?: AllowElement;
  allowedElements?: readonly string[];
  children?: string;
  components?: Components;
  disallowedElements?: readonly string[];
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  skipHtml?: boolean;
  unwrapDisallowed?: boolean;
  urlTransform?: UrlTransform;
}

// Stable references for common cases
const EMPTY_PLUGINS: PluggableList = [];
const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };

// Plugin closures and option objects are identities, not function names or
// JSON. Names collide after minification; JSON drops callbacks and rejects
// cyclic options. Weak keys also avoid retaining consumer configurations.
const identityIds = new WeakMap<object, number>();
let nextIdentityId = 0;
const cacheIdentity = (value: unknown): string => {
  if (
    value !== null &&
    (typeof value === "object" || typeof value === "function")
  ) {
    const object = value as object;
    let id = identityIds.get(object);
    if (id === undefined) {
      id = ++nextIdentityId;
      identityIds.set(object, id);
    }
    return `ref:${id}`;
  }
  return `${typeof value}:${String(value)}`;
};

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly keyCache = new WeakMap<Readonly<Options>, string>();
  private readonly maxSize = 100;

  generateCacheKey(options: Readonly<Options>): string {
    // Check WeakMap cache first for faster lookups (before any processing)
    const cachedKey = this.keyCache.get(options);
    if (cachedKey) {
      return cachedKey;
    }

    const rehypePlugins = options.rehypePlugins;
    const remarkPlugins = options.remarkPlugins;
    const remarkRehypeOptions = options.remarkRehypeOptions;

    // Fast path for no plugins (most common case)
    if (!(rehypePlugins || remarkPlugins || remarkRehypeOptions)) {
      const key = options.skipHtml ? "default:skip-html" : "default";
      this.keyCache.set(options, key);
      return key;
    }

    const serializePlugins = (plugins: PluggableList | undefined): string =>
      (plugins ?? [])
        .map((plugin) =>
          Array.isArray(plugin)
            ? plugin.map(cacheIdentity).join(":")
            : cacheIdentity(plugin)
        )
        .join(",");
    const rehypeKey = serializePlugins(rehypePlugins);
    const remarkKey = serializePlugins(remarkPlugins);
    const optionsKey = remarkRehypeOptions
      ? cacheIdentity(remarkRehypeOptions)
      : "";

    const key = `${remarkKey}::${rehypeKey}::${optionsKey}::${Boolean(options.skipHtml)}`;

    // Cache the key in WeakMap for this options object
    this.keyCache.set(options, key);

    return key;
  }

  get(options: Readonly<Options>) {
    const key = this.generateCacheKey(options);
    const processor = this.cache.get(key);

    if (processor) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, processor);
    }

    return processor;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  set(options: Readonly<Options>, processor: any): void {
    const key = this.generateCacheKey(options);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, processor);
  }

  /* v8 ignore next */
  clear(): void {
    this.cache.clear();
    // Note: WeakMap doesn't need manual clearing
  }
}

// Global processor cache instance
const processorCache = new ProcessorCache();

export const Markdown = (options: Readonly<Options>) => {
  const processor = getCachedProcessor(options);
  const content = options.children || "";
  // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies with processor configuration
  const tree = processor.runSync(processor.parse(content), content) as any;
  return post(tree, options);
};

const getCachedProcessor = (options: Readonly<Options>) => {
  // Try to get from cache first
  const cached = processorCache.get(options);
  if (cached) {
    return cached;
  }

  // Create new processor and cache it
  const processor = createProcessor(options);
  processorCache.set(options, processor);
  return processor;
};

const createProcessor = (options: Readonly<Options>) => {
  const rehypePlugins = options.rehypePlugins || EMPTY_PLUGINS;
  const remarkPlugins = options.remarkPlugins || EMPTY_PLUGINS;

  // Let arbitrary HTML parsers run, including minified or wrapped plugins.
  // Preserve any HTML they leave unparsed before the sanitizer can drop it.
  const sanitizeWithFallback = (
    ...parameters: Parameters<typeof rehypeSanitize>
  ) => {
    const sanitize = rehypeSanitize(...parameters);
    return (tree: Root) => {
      escapeRawHtml(tree, options.skipHtml);
      return sanitize(tree);
    };
  };
  const safeRehypePlugins: PluggableList = rehypePlugins.map((plugin) => {
    if (Array.isArray(plugin)) {
      return plugin[0] === rehypeSanitize
        ? [sanitizeWithFallback, ...plugin.slice(1)]
        : plugin;
    }
    return plugin === rehypeSanitize ? sanitizeWithFallback : plugin;
  });

  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options.remarkRehypeOptions }
    : DEFAULT_REMARK_REHYPE_OPTIONS;

  return unified()
    .use(remarkParse)
    .use(remarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(safeRehypePlugins)
    .use(rehypeRawFallback, options.skipHtml);
};

export const defaultUrlTransform: UrlTransform = (value) => value;

/* v8 ignore next */
const handleRawNode = (
  parent: Parents,
  index: number,
  skipHtml: boolean | undefined,
  value: string
): void => {
  /* v8 ignore next 5 */
  if (skipHtml) {
    parent.children.splice(index, 1);
  } else {
    parent.children[index] = { type: "text", value } as never;
  }
};

const transformUrls = (node: Element, transform: UrlTransform): void => {
  for (const key in urlAttributes) {
    if (
      Object.hasOwn(urlAttributes, key) &&
      Object.hasOwn(node.properties, key)
    ) {
      const value = node.properties[key];
      const test = urlAttributes[key];
      if (test === null || test.includes(node.tagName)) {
        node.properties[key] =
          transform(String(value || ""), key, node) ?? undefined;
      }
    }
  }
};

const shouldRemoveElement = (
  node: Readonly<Element>,
  index: number | undefined,
  parent: Readonly<Parents> | undefined,
  allowedElements: readonly string[] | undefined,
  disallowedElements: readonly string[] | undefined,
  allowElement: AllowElement | undefined
): boolean => {
  let remove = false;

  if (allowedElements) {
    remove = !allowedElements.includes(node.tagName);
  } else if (disallowedElements) {
    remove = disallowedElements.includes(node.tagName);
  }

  if (!remove && allowElement && typeof index === "number") {
    remove = !allowElement(node, index, parent);
  }

  return remove;
};

const post = (tree: Nodes, options: Readonly<Options>): ReactElement => {
  const {
    allowElement,
    allowedElements,
    disallowedElements,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
  } = options;

  const hasFiltering =
    allowElement ||
    allowedElements ||
    disallowedElements ||
    skipHtml ||
    urlTransform;

  if (hasFiltering) {
    const transform = urlTransform || defaultUrlTransform;

    visit(tree as Root, (node, index, parent) => {
      /* v8 ignore next */
      if (node.type === "raw" && parent && typeof index === "number") {
        /* v8 ignore next */
        handleRawNode(parent, index, skipHtml, node.value);
        return index;
      }

      if (node.type === "element") {
        transformUrls(node, transform);

        const remove = shouldRemoveElement(
          node,
          index,
          parent,
          allowedElements,
          disallowedElements,
          allowElement
        );

        if (remove && parent && typeof index === "number") {
          if (unwrapDisallowed && node.children) {
            parent.children.splice(index, 1, ...node.children);
          } else {
            parent.children.splice(index, 1);
          }
          return index;
        }
      }
    });
  }

  return toJsxRuntime(tree, {
    Fragment,
    components: options.components,
    ignoreInvalidStyle: true,
    jsx,
    jsxs,
    passKeys: true,
    passNode: true,
  });
};
