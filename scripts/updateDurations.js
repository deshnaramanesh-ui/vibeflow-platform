const mongoose = require('mongoose');
const Song = require('../models/Song');

const durations = {
  'Swim': 228, // 3:48
  'About You': 326, // 5:26
  'honeybee': 232, // 3:52
  'cry': 256, // 4:16
  'K.': 317, // 5:17
  'Apocalypse': 290, // 4:50
  'Old love': 250, // 4:10
  'Photograpgh': 259, // 4:19
  'Happier Than Ever': 298, // 4:58
  'So Easy': 228, // 3:48
  'No 1 Party Anthem': 243, // 4:03
  'Sailor Song': 222, // 3:42
  'Sunsetz': 215, // 3:35
  'Two Sides Of Goodbye': 174, // 2:54
  'Dress': 230, // 3:50
  'Just The Way You Are': 220, // 3:40
  'Every Breath You Take': 253, // 4:13
  'Those Eyes': 220, // 3:40
  'Here With Me': 242, // 4:02
  'NIGHTS LIKE THIS': 118, // 1:58
  'Deep Focus': 225, // 3:45
  'Calm music': 260, // 4:20
  'Golden Hour Study Flow': 195, // 3:15
  'Midnight Focus & Coffee': 195, // 3:15
  'Neon Tokyo Rain Desk': 210, // 3:30
  'Library Whispers & Vinyl': 225, // 3:45
  'Late Night Coding Sessions': 240, // 4:00
  'Sunset Waves by the Coast': 240, // 4:00
  'Lavender Horizon Reverie': 205, // 3:25
  'Warm Chamomile Sunset': 215, // 3:35
  'Gentle Horizon Piano': 198, // 3:18
  'Cyberpunk Neon Workout': 190, // 3:10
  'Adrenaline High Octane': 215, // 3:35
  'Overdrive Momentum': 200, // 3:20
  'Neon Skyline Sprint': 185, // 3:05
  'Gentle Midnight Window Rain': 320, // 5:20
  'Starlight Lullaby Piano': 250, // 4:10
  'Deep Cloud Drift Sleep': 310, // 5:10
  'Rain on Cozy Attic Roof': 290, // 4:50
  'Sunset Highway Roadtrip': 200, // 3:20
  'Open Road Coastal Breeze': 220, // 3:40
  'Pacific Coast Golden Drive': 210, // 3:30
  'Mountains & Pine Air': 235 // 3:55
};

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vibeflow_db');
  console.log('Connected to MongoDB.');

  for (const [title, dur] of Object.entries(durations)) {
    const res = await Song.updateMany(
      { title: { $regex: '^' + title.trim() + '$', $options: 'i' } },
      { $set: { duration: dur } }
    );
  }

  const songs = await Song.find().lean();
  console.log('\n✅ All Song Timings Updated in Database:');
  songs.forEach((s) => {
    const m = Math.floor(s.duration / 60);
    const sec = (s.duration % 60).toString().padStart(2, '0');
    console.log(` - ${s.title}: ${m}:${sec} (${s.duration}s)`);
  });

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
