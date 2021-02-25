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


## Configurations
When creating a new ImJoy Grid via `api.createWindow` or `api.showDialog`, a `config` object can be passed which may contain the following config keys:
 * `colNum`: Number, default: 20, the number of columns
 * `rowHeight`: Number, default: 30, the height of the rows
 * `verticalCompact`: Boolean, default: true, enable vertical compact mode
 * `margin`: Number, default: 3, margin between windows

If you want to change any of the config after creating the window, you can call `grid.updateConfig({...})`.

When creating windows inside the ImJoy Grid container (via `grid.createWindow`, you can pass `x`, `y` to define the position, and `w`, `h` to define the height and width.

You can also set `hide_title_bar` to `true` if you don't want to show the title bar.

You can set the `menu_button_location` to `upper-left`, `upper-right`, `lower-left`,`lower-right`, or set to `none` to hide it completely.

!> If you want to use predefined `x`, `y` position, you may want to set `verticalCompact` to `false`.


## Example: Combining tree window with vizarr

The following examples shows how to display a file tree and a [vizarr](https://github.com/hms-dbmi/vizarr) viewer. Double click on the file and the corresponding file will be added to the viewer as a new layer.

<!-- ImJoyPlugin: {"type": "native-python", "hide_code_block": true} -->
```python
from imjoy import api

class ImJoyPlugin():
    async def setup(self):
        pass
    
    async def add_image_viewer(self, grid):
        # create a window
        self.viewer = await grid.createWindow(src="https://hms-dbmi.github.io/vizarr", w=7,h=4, x=3, y=0, hide_title_bar=True, menu_button_location="upper-right")

        async def on_image_click(info):
            api.alert(info)

        self.viewer.add_image({"source": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/4495402.zarr", "name": "idr0053"})
    
    async def add_file_tree(self, grid):
        # images are from OME: https://blog.openmicroscopy.org/file-formats/community/2020/11/04/zarr-data/
        sources = {
            "idr0053": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/4495402.zarr",
            "idr0062": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/6001240.zarr",
            "idr0062-1": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/6001240.zarr",
            "idr0062-2": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/6001241.zarr",
            "idr0062-3": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/6001243.zarr",
            "idr0077": "https://s3.embassy.ebi.ac.uk/idr/zarr/v0.1/9836839.zarr"
        }
        async def node_dbclick_callback(node):
            self.viewer.add_image({"source": sources[node['title']], "name": node['title']})

        await grid.createWindow(type="imjoy/tree", w=3, x=0, y=0, h=2, hide_title_bar=True, config={
            "_rintf": True,
            "type": "tree",
            "name": "Example Zarr Files",
            "node_dbclick_callback": node_dbclick_callback,
            "nodes": [
                {"title": 'idr0077', "isLeaf": True},
                {"title": 'idr0053', "isLeaf": True},
                {"title": 'idr0062', "isExpanded": True,
                    "children": [
                        {"title": 'idr0062-1', "isLeaf": True},
                        {"title": 'idr0062-2', "isLeaf": True},
                        {"title": 'idr0062-3', "isLeaf": True},
                    ]
                }
            ],
        })
    
    async def add_schema_form(self, grid):
        schemaio = await grid.createWindow(name='DeepBindScan', type='imjoy/schema-io', w=3, x=0, y=2, h=2, hide_title_bar=True,data={})

        # prepare a schema for the form
        schema = {
            "fields": [
                {
                    "type": "select",
                    "label": "Model Type",
                    "model": "modelType",
                    "values": ["all species", "Homo_sapiens", "Danio_rerio"] 
                },
                {
                    "type": "input",
                    "inputType": "text",
                    "label": "Input Sequence",
                    "model": "DNA"
                }
            ]
        }

        # prepare a callback function
        async def callback(results):
            await api.alert(str(results))

        # generate the form
        await schemaio.append({
            "type": "form",
            "schema": schema,
            "model": {
                "DNA": "GGAGGCGGGAAGATGGAGGCGGTAGCTGTCACTAGGTTGGGGTTCTCC",
                "modelType": "all species"
            },
            "callback": callback,
            "id": 0,
            "_rintf": True
        })

    async def run(self, ctx):
        # create a grid container
        grid = await api.createWindow(src="https://grid.imjoy.io/#/app", config={"verticalCompact": False, "colNum": 10, "rowHeight": 120})
        await self.add_image_viewer(grid)
        await self.add_file_tree(grid)
        await self.add_schema_form(grid)

api.export(ImJoyPlugin())
```