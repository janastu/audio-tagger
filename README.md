# audio-tagger-ui
This is a Javascript application for audio tagging and management. 
Javascript frontend application for audio tagging and management

Audio Play Area or item view:
Collection 1: will load data from Table (ii)
Server API to get data: Pending...
Server API to Post data: Pending...
Will load with the audio player with controls, and input area
for adding attributes to the file, like Label, Name, Description, Tags.
  UI for adding attributes should be intuitive, with drag and drop feature, or
  click and choose from tagcloud.

  List View:
  Collection :  Server API to get data: http://da.server.pantoto.org/api/files
  Will contain the list of audio files, sorted by date-time of upload.
  Each list item will contain, File identifiers( like Device ID, Username and
  more..) with date-time of upload from collection 1
  If any user entries, suggestions available, should be shown from collection 2

  Features in every list item:
  Will contain Play button - > on click will load the audio file with default
  identification attributes in the Audio Play Area.
  Forward button - > onclick to share or forward content item
  More options - > on click show more options
  To add tags, POST request to server api
  http://da.server.pantoto.org/api/tags/id(mongodb)


  Tag Cloud:
  Visualization for the Tags, Categories and Users

  Tags:
  Feature - To have non-text tags, or pictures as tags for the non-literate
  users



