# Text and Suit Symbol Sizing

This project controls card text and suit symbol sizing from the shared stylesheet, not from the per-card HTML files.

## Where the content comes from

- `card_template.html` and each card HTML file provide the placeholders: `#card-value`, `#suit-icon`, `#domain-label`, and `#rules-text`.
- `card_renderer.js` fills those placeholders at runtime from `CARD_VARIANT_CONFIG`.
- The actual visual size is defined in `card_base.css`.

## Change text size

Edit these selectors in `card_base.css`:

- `.card-value`
  Controls the large number at the top-left.
- `.domain-label`
  Controls the small uppercase label above the rules text.
- `.rules-text`
  Controls the main body copy in the text panel.
- `.rules-text strong`
  Controls the bold title line inserted at the top of the rules text.

Current non-mobile base rules come from the main selectors earlier in the file. In the current file, the visible preview can still ignore those values if the browser width is 640px or less.

## Why changing `.card-value` may appear to do nothing

If this happens again, the thing to check first is whether a later, more specific rule or a media query is overriding the base selector.

For example, a base selector may look like this:

```css
.card-value {
  font-size: 1px;
}
```

If a later mobile override exists, it will win when the preview is narrow:

```css
@media (max-width: 640px) {
  .card-value {
    font-size: 142px;
  }

  .card:not(.status-card) .card-value {
    font-size: 208px;
  }

  .status-card .card-value {
    font-size: 208px;
  }
}
```

If your preview pane is narrow, that later rule wins, so changing `.card-value` near the top of the file will not affect the visible card.

To test the top-level `.card-value` rule, either:

- widen the preview so the `@media (max-width: 640px)` block stops applying, or
- change the matching rule inside the media query instead.

The current stylesheet has been updated so the mobile media query only changes the outer preview scale and page padding. It no longer changes card text, suit symbol, or panel sizing, which keeps preview output aligned with export.

Current desktop-sized examples:

```css
.card:not(.status-card) .card-value {
  font-size: 232px;
}

.card:not(.status-card) .domain-label {
  font-size: 44px;
}

.card:not(.status-card) .rules-text {
  font-size: 46px;
}
```

Status cards use their own overrides, also in `card_base.css`:

```css
.status-card .card-value {
  font-size: 232px;
}

.status-card .domain-label {
  font-size: 44px;
}

.status-card .rules-text {
  font-size: 46px;
}
```

If you want all cards to change together, edit the shared selector first, then keep or remove the more specific `.card:not(.status-card)` and `.status-card` overrides depending on whether those variants should differ.

## Change suit symbol size

There are two size layers for suit symbols in `card_base.css`:

- `.suit-icon`
  Controls the size of the symbol container.
- `.suit-icon svg` and `.suit-icon img`
  Controls the actual rendered symbol inside that container.

Current desktop values:

```css
.card:not(.status-card) .suit-icon {
  width: 244px;
  height: 244px;
}

.card:not(.status-card) .suit-icon svg,
.card:not(.status-card) .suit-icon img {
  width: 188px;
  height: 188px;
}
```

Status cards use the same 244px container and 188px rendered symbol values through their own selectors.

### If the icon looks too thick or thin

These rules affect stroke appearance for SVG symbols:

```css
.suit-icon .symbol-outline {
  stroke-width: 4;
}

.card:not(.status-card) .suit-icon .symbol-outline {
  stroke-width: 3.5;
}
```

Change `stroke-width` if you resize the symbol and want the outline weight to stay visually balanced.

## Suit symbol source files

Each card points at a symbol asset with `suitSvgPath`, for example:

```js
suitSvgPath: "./dexterity.svg"
```

That means:

- To make every Dexterity symbol larger or smaller on the card, change the CSS sizes above.
- To change the shape itself, edit the corresponding SVG file such as `dexterity.svg`, `strength.svg`, `intelligence.svg`, or `weird.svg`.

## Preview scale vs export size

At the top of `card_base.css`, `--preview-scale` changes the on-screen preview size only:

```css
:root {
  --preview-scale: 0.54;
}
```

The export layout removes that transform for full-size output, so changing `--preview-scale` will not change the actual exported card typography or suit symbol size.

## Mobile preview overrides

The current `@media (max-width: 640px)` block only changes `--preview-scale` and page padding. That means mobile preview now uses the same card internals as export, just scaled down uniformly.