const STORAGE_URL = '/shared/projects'

export interface ProjectMedia {
  src: string
  type: 'image' | 'video'
}

export interface ProjectData {
  description: string[]
  information: string
  link: string
  media: ProjectMedia[]
  mediaModifier?: string
  title: string[]
}

const projects: ProjectData[] = [
  {
    information: 'Apple',
    title: ['Apple', 'Vision Pro'],
    description: [
      'Collaborated with Apple in the development of custom tooling',
      'for real-time experiences. Our first initiative to launch the results',
      'of our exploration took place in the Product Tour modal from',
      'the Apple Vision Pro website.',
    ],
    link: 'https://apple.com/apple-vision-pro/',
    media: [{ type: 'video', src: `${STORAGE_URL}/apple-vision-pro.mp4` }],
  },
  {
    information: 'Apple',
    title: ['Apple', '3D Viewers'],
    description: [
      'Continuing our efforts on the development of real-time experiences',
      'across Apple.com pages. We have launched 3D viewers for',
      'iPhone 15, iPhone 15 Pro, iPhone 16, iPhone 16 Pro, and MacBook Pro.',
    ],
    link: 'https://apple.com/iphone-16-pro/',
    media: [
      { type: 'video', src: `${STORAGE_URL}/apple-3d-viewers-5.mp4` },
      { type: 'video', src: `${STORAGE_URL}/apple-3d-viewers-4.mp4` },
      { type: 'video', src: `${STORAGE_URL}/apple-3d-viewers-3.mp4` },
      { type: 'video', src: `${STORAGE_URL}/apple-3d-viewers-2.mp4` },
      { type: 'video', src: `${STORAGE_URL}/apple-3d-viewers-1.mp4` },
    ],
  },
  {
    information: 'Active Theory',
    title: ['Xbox', 'Museum'],
    description: [
      'Implemented the majority of the features of the experience including:',
      'main museum selector scene, 3D screens animations and states,',
      'user progress tracking, character color and shape customization,',
      'scenes interactive elements and user interfaces.',
    ],
    link: 'https://xbox.activetheory.dev/',
    media: [
      { type: 'video', src: `${STORAGE_URL}/xbox.mp4` },
      { type: 'image', src: `${STORAGE_URL}/xbox-1.jpg` },
      { type: 'image', src: `${STORAGE_URL}/xbox-2.jpg` },
      { type: 'image', src: `${STORAGE_URL}/xbox-3.jpg` },
      { type: 'image', src: `${STORAGE_URL}/xbox-4.jpg` },
      { type: 'image', src: `${STORAGE_URL}/xbox-5.jpg` },
    ],
  },
  {
    information: 'Active Theory',
    title: ['Tarot', 'with YouTube'],
    description: [
      'Implemented the tarot selection zoom animation, camera transitions',
      'between reading states, card selection and shuffle interaction,',
      'soul card webcam integration and parallax user interfaces.',
    ],
    link: 'https://tarot.withyoutube.com/',
    media: [
      { type: 'video', src: `${STORAGE_URL}/youtube.mp4` },
      { type: 'image', src: `${STORAGE_URL}/youtube-1.jpg` },
      { type: 'image', src: `${STORAGE_URL}/youtube-2.jpg` },
    ],
  },
  {
    information: 'Active Theory',
    title: ['Adventure Time', 'Distant Lands'],
    description: [
      'Implemented the majority of the interactions of the experience:',
      'introduction from galaxy to spaceship, BMO animations and reactions,',
      'computer interactive user interface, beat maker, potato pong game,',
      'spaceship screens glitch and lightspeed galaxy animation.',
    ],
    link: 'https://medium.com/active-theory/adventure-time-distant-lands-bmo-5997687372b7',
    media: [
      { type: 'video', src: `${STORAGE_URL}/adventure-time.mp4` },
      { type: 'image', src: `${STORAGE_URL}/adventure-time-1.jpg` },
      { type: 'image', src: `${STORAGE_URL}/adventure-time-2.jpg` },
      { type: 'image', src: `${STORAGE_URL}/adventure-time-3.jpg` },
      { type: 'image', src: `${STORAGE_URL}/adventure-time-4.jpg` },
    ],
  },
  {
    information: 'Active Theory',
    title: ['Trolli', 'Deliciously Dark Escape'],
    description: [
      'Implemented the wormhole introduction, colorful lighting system',
      'applied to levels sceneries, parallax comic cards, enemy explosion',
      'particles, transition glitch animation and user interfaces.',
    ],
    link: 'https://trollideliciouslydarkescape.com/awards',
    media: [
      { type: 'video', src: `${STORAGE_URL}/trolli.mp4` },
      { type: 'image', src: `${STORAGE_URL}/trolli-1.jpg` },
      { type: 'image', src: `${STORAGE_URL}/trolli-2.jpg` },
      { type: 'image', src: `${STORAGE_URL}/trolli-3.jpg` },
      { type: 'image', src: `${STORAGE_URL}/trolli-4.jpg` },
    ],
  },
  {
    information: 'Personal',
    title: ['WebGL', 'Portfolios'],
    description: [
      'Collaborated with independent artists and creatives',
      'winning the Independent of The Year 2021 prize from Awwwards',
      'with 9 Site of The Day awards in a single year.',
    ],
    link: 'https://www.awwwards.com/bizarro/submissions/',
    media: [
      { type: 'video', src: `${STORAGE_URL}/peggy-gou.mp4` },
      { type: 'video', src: `${STORAGE_URL}/thieb.mp4` },
      { type: 'video', src: `${STORAGE_URL}/design-embraced.mp4` },
      { type: 'video', src: `${STORAGE_URL}/kacper-chlebowicz.mp4` },
      { type: 'video', src: `${STORAGE_URL}/bruno-arizio.mp4` },
      { type: 'video', src: `${STORAGE_URL}/studio-maertens-1.mp4` },
      { type: 'video', src: `${STORAGE_URL}/studio-maertens-2.mp4` },
    ],
  },
  {
    information: 'Personal',
    title: ['WebGL', 'Typography'],
    description: [
      'Using WebGL and GLSL to create typography experiments',
      "with lyrics from music that I'm listening to while coding.",
    ],
    link: 'https://instagram.com/bizarro/',
    mediaModifier: '50',
    media: [
      { type: 'video', src: `${STORAGE_URL}/lyrics-1.mp4` },
      { type: 'video', src: `${STORAGE_URL}/lyrics-2.mp4` },
      { type: 'video', src: `${STORAGE_URL}/lyrics-3.mp4` },
      { type: 'video', src: `${STORAGE_URL}/lyrics-4.mp4` },
      { type: 'video', src: `${STORAGE_URL}/lyrics-5.mp4` },
      { type: 'video', src: `${STORAGE_URL}/lyrics-6.mp4` },
    ],
  },
]

export default projects
