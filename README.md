# ca-plant-list

This module contains tools and data for producing Jekyll files to create a set of static HTML pages with information about plants growing in the wild in areas of California.

While this is primarily meant as a dependency for other projects building static sites of CA plants, the default config will let you build a site:

```zsh
# Install Ruby dependencies
bundle

# Install node dependencies
npm install

# Build the site
node scripts/build-site.js

# Start a web server
bundle exec jekyll serve --config output/_config.yml -s output
```

You can even build an ebook!

```zsh
node scripts/build-ebook.js

# ebook is at output/ebplants.epub
```
