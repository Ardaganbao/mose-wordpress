# mose-wordpress

WordPress side of [MOSE](https://github.com/Ardaganbao/Mose): the **WP Arda-Report** plugin, installed in the folder `multi-block`.

- **Report** and **Customer** post types, under the **Reports** menu.
- Report blocks: Title, Client, Introduction (context, author, revisions, customer address), Social, version, arda_MQ.
- The graphs of the MOSE Markdown reports: `view.js` draws the ``` blocks named `Volbarstacked`, `NasVolume`, `CommVaultJob`, `plotly`, `plotlybarstacked`, `Multiline`, `StorageEvolution` and `warningPie` with Chart.js, from the table inside them.

## Install

1. Download `multi-block.zip` from the [latest release](https://github.com/Ardaganbao/mose-wordpress/releases/latest).
2. In WordPress: **Plugins → Add New → Upload Plugin**, choose the zip, install and activate. On a site that already has the plugin, WordPress offers to replace it: accept.

The site needs PHP 8.0 or later.

## Updates

From then on, a new release shows on the site's **Plugins** page like any other plugin update ([Plugin Update Checker](https://github.com/YahnisElsts/plugin-update-checker), bundled in `plugin-update-checker/`). WordPress checks every 12 hours; **Dashboard → Updates → Check again** checks now.

A site with a version from before the updater (1.0.0) must install the zip once by hand, as above.

## Make a release

1. Change `Version:` in `multi-block.php` (e.g. `1.2.0`) and push to `main`.
2. Tag that commit and push the tag:

   ```powershell
   git tag -a v1.2.0 -m "WP Arda-Report 1.2.0"
   git push origin v1.2.0
   ```

The [Release workflow](.github/workflows/release.yml) checks that the tag matches the version, builds `multi-block.zip` and publishes the release. A tag with a suffix, like `v1.2.0-rc.1`, is a pre-release: the sites ignore it, so it can be tested by installing its zip by hand.

## Graph blocks

A graph is a ``` block whose name is the graph type, with a Markdown table inside: the first row is the title then the labels, the `|---|` row is skipped, the other rows are the data.

````
```Volbarstacked
| Disk % | datastore1 |
|--------|------------|
| Free   |  34        |
```
````

| Block | Drawn as |
|---|---|
| `Volbarstacked`, one data row | Used / Free stacked bars; Free is orange under 25 %, dark orange under 15 % |
| `Volbarstacked`, `CommVaultJob`, `plotlybarstacked`, several rows | Stacked bars, one dataset per row |
| `NasVolume`, `warningPie` | Pie of the first data row |
| `Multiline`, `StorageEvolution` | Lines, one per row |
| `plotly` | Bars |

## Known issues

- **The print link exposes the login session.** For a logged-in user, `front_print_footer_scripts()` writes a `spietopdf:` link at the bottom of every page with the value of the `wordpress_logged_in_*` cookie, for the PDF printer. Anyone who gets the page's HTML (cache, saved page, browser extension, script on the page) can use it to log in as that user. Kept on purpose until the PDF printer has another way to authenticate.
