# Blend & Read

A free phonics game for UK Reception children who are learning to blend three-letter words (CVC words like *cat*, *dog*, *sun*). It runs in the browser on an iPad, tablet, phone or laptop, and there is nothing to install.

It is all one file, `index.html`. Open it in a browser and it works.

## What's inside

| Game | What it practises |
|---|---|
| **Blend It** | Tap each sound button (red dot = one sound, line = two letters, one sound), then press *Blend it!* to hear the word and see the picture. |
| **Read and Match** | Read the word and choose the matching picture from three. If they get it wrong, a *Sound it out* hint appears. |
| **Spell It** | See a picture, hear the word, and build it from letter tiles (segmenting, which is blending in reverse). |
| **Balloon Pop** | Hear a word and pop the balloon that says it. Tapping the wrong one tells them what that balloon says. |
| **Alien Words** | Decide if a word is real or an "alien" (made-up) word. This prepares children for the Year 1 Phonics Screening Check. |
| **Stories** | Ten short books written in decodable words. Each page has a picture. Tap any word to hear it sounded out. Tricky words (*the, to, I, no, go*) have a yellow line. Each book ends with a picture question. |
| **My Stickers** | Every correct answer earns a star. Every 5 stars unlocks a sticker. |

There are two levels, which you can change in the **Grown-ups** area (press and hold the button):

- **Level 1**: Phase 2 CVC words (cat, pig, hen, bus...).
- **Level 2**: Phase 3 "special friends" (sh, ch, th, ng, ee, oo, ai, ar...), such as ship, moon and rain.

## Record the sounds in your own voice (recommended)

Computer voices are poor at pure phonics sounds. They often add "uh" (saying "buh" instead of a clean "b"). In **Grown-ups → Record the sounds**, tap 🎙 next to each sound and say it the way school does. The app then uses your voice in every game. Recordings stay on that device.

## Getting it onto the iPad or phone

The easiest way is **GitHub Pages**:

1. On GitHub, open this repository and go to **Settings → Pages**.
2. Under *Build and deployment*, choose **Deploy from a branch**, then pick the branch and the `/ (root)` folder, and press **Save**.
3. After a minute you will get a link like `https://<your-username>.github.io/Phonics/`.
4. Open that link on the iPad in Safari, tap **Share → Add to Home Screen**. It now opens full screen like an app.

Stars, stickers and recordings are saved on each device separately.

## How to help at home

- **Little and often.** Ten minutes a day beats an hour at the weekend. Stop while it is still fun.
- **Use pure sounds.** Say "mmm", "sss", and "t" with no "uh" at the end, so c-a-t blends to "cat".
- **Point and push.** Your child touches each sound button while saying the sound, then sweeps a finger underneath and says the word fast.
- **Oral blending with no letters:** "Touch your h-ea-d", "Where's the c-u-p?", "I spy a d-o-g".
- **Tricky words** (the, to, I, no, go, said, was) can't be sounded out. Learn them by sight.
- **Ask the school which scheme they use** (Little Wandle, Read Write Inc., Monster Phonics, and others) and match their sound names and teaching order. Read the school's decodable reading book first, and use this app as extra practice.

## Adding your own words, stories or photos

Everything lives in lists near the top of the `<script>` in `index.html`:

- `CVC` and `DIGRAPH`: words and their picture (an emoji).
- `ALIEN`: made-up words.
- `STORIES`: each page is `[picture, sentence]`, plus one question at the end.

To use a real photo instead of an emoji, put an `<img src="...">` tag where the emoji goes.
