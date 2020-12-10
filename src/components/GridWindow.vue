<template>
  <div
    class="gridwindow noselect"
    ref="gridwindow"
    @mouseup="show_overlay = false"
    @click="unselectWindows($event)"
  >
    <div class="lds-ellipsis" v-show="loading">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <div
      @mousemove="overlayMousemove"
      class="overlay"
      @click="show_overlay = false"
      v-if="show_overlay"
    ></div>
    <grid-layout
      v-if="wm && gridWindows"
      :layout.sync="gridWindows"
      v-show="!wm.selected_window && gridWindows.length > 0"
      style="min-height:100%"
      :col-num.sync="colNum"
      :is-mirrored="false"
      :auto-size="true"
      :row-height.sync="rowHeight"
      :is-responsive="true"
      :is-draggable="true"
      :is-resizable="true"
      :vertical-compact="verticalCompact"
      :margin="[margin, margin]"
      :use-css-transforms="true"
      ref="window_grid"
    >
      <grid-item
        v-show="!w.hidden"
        :key="w.id"
        v-for="w in gridWindows"
        drag-allow-from=".drag-handle"
        drag-ignore-from=".no-drag"
        :x="w.x"
        :y="w.y"
        :w.sync="w.w"
        :h.sync="w.h"
        :i="w.i"
        @resize="viewChanging(w)"
        @move="viewChanging(w)"
        @resized="
          show_overlay = false;
          w.resize && w.resize();
          focusWindow(w);
        "
        @moved="
          show_overlay = false;
          w.move && w.move();
          focusWindow(w);
        "
      >
        <window
          :w="w"
          @detach="detach"
          :withDragHandle="true"
          @duplicate="duplicate"
          @select="selectWindow"
          :loaders="wm.registered_loaders"
          @close="close"
          @fullscreen="fullScreen"
          @normalsize="normalSize"
          @hide="hide"
        ></window>
      </grid-item>
    </grid-layout>
    <div
      class="md-layout md-gutter md-alignment-center-center"
      v-if="!gridWindows || gridWindows.length === 0"
    >
      <md-empty-state
        md-icon="https://imjoy.io/static/img/imjoy-io-icon.svg"
        md-label=""
        md-description=""
      >
      </md-empty-state>
    </div>
    <div v-if="wm">
      <window
        :w="w"
        @detach="detach"
        v-for="w in standaloneWindows"
        :key="w.id + '_standalone'"
        v-show="wm.selected_window === w && !w.hidden"
        :loaders="wm.registered_loaders"
        :withDragHandle="false"
        @duplicate="duplicate"
        @select="selectWindow"
        @close="close"
        @fullscreen="fullScreen"
        @normalsize="normalSize"
        @hide="hide"
      ></window>
    </div>
  </div>
</template>

<script>
import { randId, assert } from "../utils.js";
import { ImJoy } from "imjoy-core";
import { setupImJoyAPI } from "../imjoyAPI.js";
import Window from "@/components/Window";
export default {
  name: "grid-window",
  components: { window: Window },
  props: {
    mode: {
      type: String,
      default: function() {
        return "grid";
      }
    }
  },
  data() {
    return {
      rowHeight: 30,
      columnWidth: 30,
      colNum: 20,
      active_windows: [],
      show_overlay: false,
      scrolling: false,
      scrollClientY: 0,
      screenWidth: window.innerWidth,
      windows: [],
      selected_workspace: "default",
      imjoy: null,
      wm: null,
      verticalCompact: true,
      margin: 3,
      loading: false
    };
  },
  created() {
    const self = this;
    // inside an iframe
    if (window.self !== window.top) {
      this.loading = true;
      setupImJoyAPI({
        createWindow(config) {
          return self.imjoy.pm.createWindow(null, config);
        },
        updateConfig: this.updateConfig
      })
        .then(imjoy_api => {
          const wrapped_imjoy_api = {};
          for (let k of Object.keys(imjoy_api)) {
            if (["export", "registerCodec", "dispose"].includes(k)) continue;
            if (typeof imjoy_api[k] === "function")
              wrapped_imjoy_api[k] = function() {
                // remove the first argument which is the plugin
                return imjoy_api[k].apply(
                  this,
                  Array.prototype.slice(arguments).slice(1)
                );
              };
            else if (typeof imjoy_api[k] === "object") {
              wrapped_imjoy_api[k] = {};
              for (let u of Object.keys(imjoy_api[k])) {
                if (typeof imjoy_api[k][u] === "function")
                  wrapped_imjoy_api[k][u] = function() {
                    // remove the first argument which is the plugin
                    return imjoy_api[k][u].apply(
                      this,
                      Array.prototype.slice(arguments).slice(1)
                    );
                  };
                else wrapped_imjoy_api[k][u] = imjoy_api[k][u];
              }
            } else wrapped_imjoy_api[k] = imjoy_api[k];
          }
          wrapped_imjoy_api._rintf = true;
          self.imjoy = new ImJoy({ imjoy_api: wrapped_imjoy_api });

          self.imjoy.start().then(() => {
            this.wm = self.imjoy.wm;
            this.windows = this.wm && this.wm.windows;
            assert(this.windows);
            this.event_bus = this.wm.event_bus;
            this.event_bus.on("add_window", this.onWindowAdd);
            this.event_bus.on("close_window", this.onWindowClose);
            this.event_bus.on("resize", this.updateSize);
          });
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      // standalone mode
      self.imjoy = new ImJoy({
        imjoy_api: {
          createWindow(_plugin, config) {
            if (config.src && config.src.startsWith("https://grid.imjoy.io")) {
              self.updateConfig(config.config);
              return {
                _rintf: true,
                createWindow(config) {
                  return self.imjoy.pm.createWindow(_plugin, config);
                },
                updateConfig: self.updateConfig
              };
            }
            return self.imjoy.pm.createWindow(_plugin, config);
          },
          showDialog(_plugin, config) {
            return self.imjoy.pm.createWindow(_plugin, config);
          }
        }
      });
      self.imjoy.start().then(async () => {
        this.wm = self.imjoy.wm;
        this.windows = this.wm && this.wm.windows;
        assert(this.windows);
        this.event_bus = this.wm.event_bus;
        this.event_bus.on("add_window", this.onWindowAdd);
        this.event_bus.on("close_window", this.onWindowClose);
        this.event_bus.on("resize", this.updateSize);
        await self.imjoy.pm.reloadPluginRecursively({
          uri:
            "https://imjoy-team.github.io/jupyter-engine-manager/Jupyter-Engine-Manager.imjoy.html"
        });
        this.loadPluginByQuery();
      });
    }
  },
  mounted() {
    this.screenWidth = window.innerWidth;
    this.colNum = parseInt(
      this.$refs.gridwindow.clientWidth / this.columnWidth
    );
    window.onbeforeunload = function(evt) {
      var message = "Are you sure you want to leave?";
      if (typeof evt == "undefined") {
        evt = window.event;
      }
      if (evt) {
        evt.returnValue = message;
      }
      return message;
    };
  },
  beforeDestroy() {
    this.event_bus.off("add_window", this.onWindowAdd);
    this.event_bus.off("close_window", this.onWindowClose);
    this.event_bus.off("resize", this.updateSize);
  },
  computed: {
    gridWindows: function() {
      return this.windows.filter(w => {
        return !w.dialog && !w.standalone && this.mode === "grid";
      });
    },
    standaloneWindows: function() {
      return this.windows.filter(this.isStandaloneWindow);
    }
  },
  methods: {
    loadPlugin(p) {
      if (!p) {
        p = prompt(
          `Please type a ImJoy plugin URL`,
          "https://github.com/imjoy-team/imjoy-plugins/blob/master/repository/ImageAnnotator.imjoy.html"
        );
        if (!p) return;
      }
      this.loading = true;
      this.imjoy.pm
        .reloadPluginRecursively({
          uri: p
        })
        .then(async plugin => {
          this.loading = true;
          try {
            if (plugin.api.run) {
              await plugin.api.run({ config: {}, data: {} });
            }
            this.imjoy.pm.imjoy_api.showMessage(
              null,
              `Plugin ${plugin.name} successfully loaded, you can now run it from the ImJoy plugin menu.`
            );
          } finally {
            this.loading = false;
          }
        })
        .catch(e => {
          console.error(e);
          this.imjoy.pm.imjoy_api.showMessage(
            null,
            `Failed to load the plugin, error: ${e}`
          );
        });
    },
    loadPluginByQuery() {
      if (this.$route.query.plugin || this.$route.query.p) {
        const p = this.$route.query.plugin || this.$route.query.p;
        this.loadPlugin(p);
      }
    },
    updateConfig(config) {
      if (config.colNum !== undefined) this.colNum = config.colNum;
      if (config.rowHeight !== undefined) this.rowHeight = config.rowHeight;
      if (config.verticalCompact !== undefined)
        this.verticalCompact = config.verticalCompact;
      if (config.margin !== undefined) this.margin = config.margin;
      this.$forceUpdate();
    },
    isStandaloneWindow(w) {
      return !w.dialog && (this.mode !== "grid" || w.standalone);
    },
    overlayMousemove(e) {
      const bbox = this.$refs.gridwindow.getBoundingClientRect();
      const top = bbox.y;
      const bottom = bbox.y + bbox.height;
      this.scrollClientY = e.clientY;
      let scroll;
      if (this.scrollClientY < top + 10) {
        scroll = () => {
          this.$refs.gridwindow.scrollTop =
            this.$refs.gridwindow.scrollTop - (top - this.scrollClientY) / 2;
          if (this.show_overlay && this.scrollClientY < top) {
            this.scrolling = true;
            window.requestAnimationFrame(scroll);
          } else {
            this.scrolling = false;
          }
        };
        if (!this.scrolling) scroll();
      } else if (this.scrollClientY > bottom - 20) {
        scroll = () => {
          this.$refs.gridwindow.scrollTop =
            this.$refs.gridwindow.scrollTop +
            (this.scrollClientY - bottom + 20) / 2;
          if (this.show_overlay && this.scrollClientY > bottom - 10) {
            this.scrolling = true;
            window.requestAnimationFrame(scroll);
          } else {
            this.scrolling = false;
          }
        };
        if (!this.scrolling) scroll();
      }
    },
    updateSize(e) {
      this.screenWidth = e.width;
      // this.columnWidth = parseInt(this.screenWidth/60)
      this.colNum = parseInt(
        this.$refs.gridwindow.clientWidth / this.columnWidth
      );
    },
    onWindowAdd(w) {
      if (w.fullscreen) {
        this.fullScreen(w);
      }
      this.selectWindow(w, {});
      this.$forceUpdate();
    },
    onWindowClose() {
      this.$forceUpdate();
    },
    detach(w) {
      this.close(w);
      const new_w = Object.assign({}, w, {
        name: w.name,
        type: w.window_type,
        data: w.data,
        config: w.config,
        w: w.w,
        h: w.h,
        fullscreen: w.fullscreen,
        standalone: true
      });
      this.$nextTick(() => {
        this.$emit("create", new_w);
      });
    },
    close(w) {
      // hide it to make it more responsive
      this.hide(w);
      const ai = this.active_windows.indexOf(w);
      if (ai >= 0) {
        this.active_windows[ai].selected = false;
        this.active_windows[ai].refresh();
        this.active_windows.splice(ai, 1);
        this.wm.active_windows = this.active_windows;
        this.$emit("select", this.active_windows, null);
      }
      w.close();
      this.$emit("close", w);
    },
    isTypedArray(obj) {
      return !!obj && obj.byteLength !== undefined;
    },
    hide(w) {
      w.hidden = true;
      w.__h = w.h;
      w.__w = w.w;
      w.w = 0;
      w.h = 0;
    },
    fullScreen(w) {
      w.fullscreen = true;
      this.colNum = parseInt(
        this.$refs.gridwindow.clientWidth / this.columnWidth
      );
      const fh = parseInt(
        (this.$refs.gridwindow.clientHeight - 76) / this.rowHeight
      );
      const fw =
        parseInt(this.$refs.gridwindow.clientWidth / this.columnWidth) + 1;
      w._h = w.h;
      w._w = w.w;
      w.h = fh;
      w.w = fw;
      this.$refs.window_grid.layoutUpdate();
      setTimeout(() => {
        w.resize();
        w.refresh();
        w.focus();
      }, 500);
    },
    normalSize(w) {
      this.colNum = parseInt(
        this.$refs.gridwindow.clientWidth / this.columnWidth
      );
      w.fullscreen = false;
      w.h = w._h || 5;
      w.w = w._w || 5;
      w._w = null;
      w._h = null;
      this.$refs.window_grid.layoutUpdate();
      setTimeout(() => {
        w.resize();
        w.refresh();
        w.focus();
      }, 500);
    },
    duplicate(w) {
      this.$emit("create", {
        name: w.name + randId(),
        type: w.window_type,
        data: w.data,
        config: w.config,
        w: w.w,
        h: w.h,
        fullscreen: w.fullscreen,
        standalone: w.standalone
      });
    },
    unselectWindows(e) {
      if (!e.target.classList.contains("vue-grid-layout")) {
        return;
      }
      if (this.active_windows && this.active_windows.length > 0) {
        for (let i = 0; i < this.active_windows.length; i++) {
          this.active_windows[i].selected = false;
          this.active_windows[i].refresh();
        }
        this.active_windows = [];
        this.wm.active_windows = this.active_windows;
        this.$emit("select", this.active_windows, null);
        this.$forceUpdate();
      }
    },
    selectWindow(w, evt) {
      if (!this.isStandaloneWindow(w)) {
        this.wm.selected_window = null;
      }
      w.selected = true;
      w.refresh && w.refresh();
      if (
        this.active_windows.length <= 0 ||
        this.active_windows[this.active_windows.length - 1] !== w
      ) {
        //unselect previous windows if no shift key pressed
        if (!evt.shiftKey) {
          for (let i = 0; i < this.active_windows.length; i++) {
            this.active_windows[i].selected = false;
            this.active_windows[i].refresh();
          }
        }
        if (evt.shiftKey && this.active_windows.length > 0) {
          this.active_windows.push(w);
        } else {
          this.active_windows = [w];
        }
        this.wm.active_windows = this.active_windows;
        this.$emit("select", this.active_windows, w);
      } else if (!evt.shiftKey && this.active_windows.length > 1) {
        for (let i = 0; i < this.active_windows.length; i++) {
          if (this.active_windows[i] !== w)
            this.active_windows[i].selected = false;
          this.active_windows[i].refresh();
        }
        this.active_windows = [w];
      }
      this.$forceUpdate();
    },
    viewChanging() {
      this.show_overlay = true;
      //this.$refs.gridwindow.scrollTop = this.$refs.gridwindow.scrollHeight
    },
    focusWindow(w) {
      this.show_overlay = false;
      this.selectWindow(w, {});
      window.dispatchEvent(new Event("resize"));
    },
    stopDragging() {
      setTimeout(() => {
        this.show_overlay = false;
        this.$forceUpdate();
      }, 300);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.gridwindow {
  height: calc(100vh - 8px);
  position: relative;
  overflow: auto !important;
}

.md-empty-state {
  position: absolute;
  top: 39%;
  transform: translateY(-50%);
  height: 100%;
}

.md-card {
  /* width: 450px;*/
  /* height: 300px; */
  width: 100%;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  margin: 0px;
}

.window-selected {
  color: var(--md-theme-default-text-accent-on-primary, #fff) !important;
  background-color: var(--md-theme-default-primary, #448aff) !important;
  height: 30px !important;
}

.window-header {
  color: var(--md-theme-default-text-primary-on-primary, #fff) !important;
  background-color: #ddd !important;
  height: 30px !important;
}
.fill-container {
  width: 100%;
  height: 100%;
}

.window-title {
  font-size: 1.2em;
  white-space: nowrap;
}

.allow-scroll {
  overflow: auto !important;
}

.generic-plugin-window {
  overflow: auto;
}

.iframe-load-button {
  width: 100%;
  height: 100%;
}

.overlay {
  z-index: 8888 !important;
  background-color: rgba(1, 1, 1, 0.05);
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
}

.lds-ellipsis {
  display: inline-block;
  width: 80px;
  height: 80px;
  position: absolute;
  top: calc(50% + 20px);
  left: 50%;
  z-index: 9999;
  transform: translate(-50%, 0);
}

.lds-ellipsis div {
  position: absolute;
  top: 33px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #448aff;
  animation-timing-function: cubic-bezier(0, 1, 1, 0);
}

.lds-ellipsis div:nth-child(1) {
  left: 8px;
  animation: lds-ellipsis1 0.6s infinite;
}

.lds-ellipsis div:nth-child(2) {
  left: 8px;
  animation: lds-ellipsis2 0.6s infinite;
}

.lds-ellipsis div:nth-child(3) {
  left: 32px;
  animation: lds-ellipsis2 0.6s infinite;
}

.lds-ellipsis div:nth-child(4) {
  left: 56px;
  animation: lds-ellipsis3 0.6s infinite;
}

@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }

  100% {
    transform: scale(0);
  }
}

@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }

  100% {
    transform: translate(24px, 0);
  }
}
</style>
