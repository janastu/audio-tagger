# audio-tagger
Javascript application for audio tagging and management for Community
Radio

Features:
Get audio files from Server
Api request returns a collection of urls for mp3 files
Api should allow to post uploads
more on that here: https://github.com/janastu/da-server

HTML5 audio player to load and play audio

Add tags to the Audio file - Should include text and non-text input(at this
time thinking about emoji).

Tag Management:
Set Tags: A set of pre-defined tags, whose definition should help in
workflow management.
Suggested Tags: Community suggested tags
Social Networking features like, unline and share audio.

Installation
Python virtualenv requires
Install dependencies
python setup.py install

SwtStore is used for User authentication and Tag, feedback storing
Check out on how to set up the store,
https://github.com/janastu/swtstore 

copy sampleConfig.py to config.py
and fill all the details

python servers/audioApp.py

Need help with documentation, testing!

