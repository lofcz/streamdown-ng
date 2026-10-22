import { useLayoutEffect, useRef } from "react";
import type { Pluggable } from "unified";
import type { AnimateOptions, AnimatePlugin, AnimateTimeline } from "./animate";
import type { AnimationEngine } from "./plugin-types";
import { createShownTextPlugin, type ShownTextPlugin } from "./shown-text";

interface BlockAnimationOptions {
  animatedKey: string;
  animateText: boolean;
  animationKey: string;
  basePlugins: Pluggable[];
  blockKeys: string[];
  engine: AnimationEngine | undefined;
  engineVersion: number;
  maxBacklogMs: number | undefined;
  options: AnimateOptions;
}

interface AnimationState {
  basePlugins: Pluggable[] | undefined;
  engineVersion: number;
  key: string;
  plugins: Map<string, AnimatePlugin>;
  rehype: Map<string, Pluggable[]>;
  replaced: Map<string, AnimatePlugin>;
  shown: Map<string, ShownTextPlugin>;
  timeline: AnimateTimeline | undefined;
}

// React block IDs are stable during hydration; module counters are not.
const blockSeed = (key: string): number => {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) % 4_294_967_296;
  }
  return hash;
};

const prepareTimeline = (
  state: AnimationState,
  config: BlockAnimationOptions
) => {
  const { engine, animationKey, engineVersion, animateText, maxBacklogMs } =
    config;
  if (!engine) {
    state.timeline = undefined;
    state.plugins.clear();
    state.rehype.clear();
    state.key = "";
    return;
  }
  if (state.key !== animationKey || !state.timeline) {
    state.replaced =
      state.engineVersion !== engineVersion ? state.plugins : new Map();
    state.plugins = new Map();
    state.rehype.clear();
    state.timeline = engine.createTimeline({ maxBacklogMs });
    state.engineVersion = engineVersion;
    state.key = animationKey;
  }
  if (animateText) {
    state.timeline.beginPass(state.timeline.now());
  }
};

const commitBlocks = (state: AnimationState, config: BlockAnimationOptions) => {
  const { animatedKey, animateText, engine, blockKeys } = config;
  const current = new Set(blockKeys);
  for (const collection of [state.plugins, state.rehype, state.shown]) {
    for (const key of collection.keys()) {
      if (!current.has(key)) {
        collection.delete(key);
      }
    }
  }
  // Only committed DOM counts as visible while a lazy engine is unavailable.
  if (!animatedKey) {
    state.shown.clear();
  } else if (engine && animateText) {
    for (const key of blockKeys) {
      if (state.plugins.has(key)) {
        state.shown.delete(key);
      }
    }
  }
  state.replaced.clear();
  if (blockKeys.length === 0) {
    state.timeline = undefined;
    state.key = "";
  } else if (animateText) {
    state.timeline?.commitPass();
  }
};

const pluginForBlock = (
  state: AnimationState,
  config: BlockAnimationOptions,
  key: string
): AnimatePlugin | null => {
  if (!(config.engine && state.timeline && config.animateText)) {
    if (!config.animatedKey) {
      return null;
    }
    let shown = state.shown.get(key);
    if (!shown) {
      shown = createShownTextPlugin();
      state.shown.set(key, shown);
    }
    return shown;
  }
  const cached = state.plugins.get(key);
  if (cached) {
    return cached;
  }
  const plugin = config.engine.createBlockPlugin({
    ...config.options,
    timeline: state.timeline,
    seed: blockSeed(key),
  });
  const replaced = state.replaced.get(key);
  if (replaced) {
    plugin.setPrevContentLength(replaced.getLastRenderCharCount());
  } else {
    const shown = state.shown.get(key);
    if (shown) {
      plugin.setPrevContentLength(shown.committedCharCount());
    }
  }
  state.plugins.set(key, plugin);
  return plugin;
};

/** Keep per-block history and a shared timeline across lazy engine handoffs. */
export const useBlockAnimation = (config: BlockAnimationOptions) => {
  const stateRef = useRef<AnimationState | null>(null);
  stateRef.current ??= {
    basePlugins: undefined,
    engineVersion: config.engineVersion,
    key: "",
    plugins: new Map(),
    rehype: new Map(),
    replaced: new Map(),
    shown: new Map(),
    timeline: undefined,
  };
  const state = stateRef.current;
  prepareTimeline(state, config);
  if (state.basePlugins !== config.basePlugins) {
    state.basePlugins = config.basePlugins;
    state.rehype.clear();
  }
  useLayoutEffect(() => commitBlocks(state, config));

  return (index: number) => {
    const key = config.blockKeys[index];
    const blockAnimatePlugin = pluginForBlock(state, config, key);
    if (!blockAnimatePlugin) {
      return { blockAnimatePlugin, blockRehypePlugins: config.basePlugins };
    }
    let blockRehypePlugins = state.rehype.get(key);
    if (blockRehypePlugins?.at(-1) !== blockAnimatePlugin.rehypePlugin) {
      blockRehypePlugins = [
        ...config.basePlugins,
        blockAnimatePlugin.rehypePlugin,
      ];
      state.rehype.set(key, blockRehypePlugins);
    }
    return { blockAnimatePlugin, blockRehypePlugins };
  };
};
