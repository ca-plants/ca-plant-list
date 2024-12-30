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

## Usage

```zsh
npm i --save @ca-plant-list/ca-plant-list
```

### Customizing Photos

ca-plant-list loads photos of plants from iNat and maintains lists of photos of all the plants it knows about from both licensed iNat taxon photos and licensed iNat observation photos. If you want to customize the photos that appear on your site, you can add a file of iNat photo data to your local setup. This package provides some tools for doing so. For example, if you wanted to use photos from observations from Alameda and Contra Costa Counties, you could do this:

```zsh
npx node ./node_modules/@ca-plant-list/ca-plant-list/scripts/inatobsphotos.js -fn inatphotos.csv -q "place_id=845,1527"
```

That will create `data/inatphotos.csv` in your repo, populated by photos from verifiable observations of the taxa in data/taxa.csv from the place IDs identified in the `-q` param. It chooses from the most-faved observations with the "CC BY" or "CC BY-NC" licenses, or the CC0 declaration.

If you want to load from iNat taxon photos instead, you can do

```zsh
npx node ./node_modules/@ca-plant-list/ca-plant-list/scripts/inattaxonphotos.js -fn inatphotos.csv
```

The only reason to do that would be to get more recently-updated iNat taxon photos than ca-plant-list knows about.
