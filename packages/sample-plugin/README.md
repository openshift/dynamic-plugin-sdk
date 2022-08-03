# Sample plugin

### Docker config

There's docker config with caddy server for easier build and run of the plugin. The Caddy config utilizes two environment variables

* `PLUGIN_URL` - (*defaults to `/`*) defines which URL should be used when pulling assets, **example** `PLUGIN_URL=/foo/bar` will serve the assets on `localhost:8000/foo/bar`
* `FALLBACK_URL` - (*defaults to `/`*) if the file is not found caddy will use this URL as a fallback and will look for index.html (SPA behavior) **example** `FALLBACK_URL=/baz` will serve the index.html from `/baz` folder.

#### Running with docker

The caddy server is by default serving content over from port `8000` in order to see it locally you'll have to map your machine's port to caddy's port

```bash
> docker run -p 80:8000 sample-plugin
```
