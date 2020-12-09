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