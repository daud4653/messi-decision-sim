# Supplied artwork

The two original PNG sticker sheets are preserved, including their transparency.
`lib/stickers.ts` defines individual cropped views with the source sheet size and SVG viewBox coordinates. `StickerAsset` renders those views directly; no redraw or generative replacement is involved.

- Six Sticker Icons of a Football Legend.png: Messi era artwork, landing hero, match detail and completion state.
- Ultimate Football Sticker Collage.png: tactical-board thinking accent and football icon.

The three era selections use distinct Barcelona 2010–12, Barcelona 2018/19 and Argentina stickers. These are illustrations, not documentary kit references or player tracking positions. The pitch keeps its accurate number marker; artwork appears beside match context.

If a sheet cannot load, the number-10 badge remains visible. To add an individual image later, provide its dimensions and full image viewBox in the registry. Keep the original supplied files intact.
