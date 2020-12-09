# ImJoy Grid API

A draggable, resizable grid container for ImJoy windows

## Basic usage
You can create a grid container by calling `api.createWindow` or `api.showDialog`, then use the returned object to create child window inside the grid container.

<!-- tabs:start -->

#### ** JavaScript **
```js
// show as an inline window
const grid = await api.createWindow({src: "https://grid.imjoy.io/#/app"})
// show as a dialog
const grid = await api.showDialog({src: "https://grid.imjoy.io/#/app"})

// call grid.createWindow instead of api.createWindow
```

Try the example below:
<!-- ImJoyPlugin: {"type": "web-worker", "editor_height": "400px"} -->
```js
class ImJoyPlugin {
    async setup() {}
    async run(ctx) {
        const grid = await api.createWindow({src: "https://grid.imjoy.io/#/app"})
        const viewer = await grid.createWindow({src: "https://kaibu.org/#/app", name: "Kaibu"})
        await viewer.view_image("https://images.proteinatlas.org/61448/1319_C10_2_blue_red_green.jpg")
    }
}
api.export(new ImJoyPlugin())
```

#### ** Python **
```js
// show as an inline window
grid = await api.createWindow(src="https://grid.imjoy.io/#/app")
// show as a dialog
grid = await api.showDialog(src="https://grid.imjoy.io/#/app")
```

Try the example below:

<!-- ImJoyPlugin: {"type": "native-python", "editor_height": "400px"} -->
```python
from imjoy import api

class ImJoyPlugin():
    async def setup(self):
        pass

    async def run(self, ctx):
        grid = await api.createWindow(src="https://grid.imjoy.io/#/app")
        viewer = await grid.createWindow(src="https://kaibu.org/#/app")
        await viewer.view_image("https://images.proteinatlas.org/61448/1319_C10_2_blue_red_green.jpg")

api.export(ImJoyPlugin())
```
<!-- tabs:end -->


### Configurations
When creating a new ImJoy Grid via `api.createWindow` or `api.showDialog`, a `config` object can be passed which may contain the following config keys:
 * `colNum`: Number, default: 20, the number of columns
 * `rowHeight`: Number, default: 30, the height of the rows
 * `verticalCompact`: Boolean, default: true, enable vertical compact mode

If you want to change any of the config after creating the window, you can call `grid.updateConfig({...})`.

When creating windows inside the ImJoy Grid container (via `grid.createWindow`, you can pass `x`, `y` to define the position, and `w`, `h` to define the height and width.

You can also set `hide_title_bar` to `true` if you don't want to show the title bar.

!> If you want to use predefined `x`, `y` position, you may want to set `verticalCompact` to `false`.



<!-- ImJoyPlugin: {"type": "native-python", "editor_height": "400px"} -->
```python
from imjoy import api

class ImJoyPlugin():
    async def setup(self):
        pass

    async def run(self, ctx):
        # create a grid container
        grid = await api.createWindow(src="http://localhost:8080/#/app", config={"verticalCompact": False, "colNum": 5, "rowHeight": 30})

        # create a window
        viewer = await grid.createWindow(src="https://kaibu.org/#/app", w=2, x=0, y=0)
        await viewer.view_image("https://images.proteinatlas.org/61448/1319_C10_2_blue_red_green.jpg")

        # create another window
        viewer = await grid.createWindow(src="https://imjoy.io/docs", passive=True, w=2, x=2, y=0)

api.export(ImJoyPlugin())
```