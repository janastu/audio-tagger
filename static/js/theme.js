//default audio collection, with file identifiers
//like ID, date-time stamp, tags(if available)
var audioCollection = Backbone.Collection.extend({
  model: Backbone.Model,
    initialize: function(options) {
      console.log(options);
      this.url = options.url;
    },
    comparator: function(model) {
      return -Date.parse(model.get("date"));   
    }



});


//TODO:  Log in view
//should work on extending as we pipeline the upcoming features

var loginView = Backbone.View.extend({
  el: "",
    events: {
    },
    initialize: function() {
    },
    render: function() {
    }

});


//admin control panel
//
var adminDash = Backbone.View.extend({
  el: "#auth-form",
    events: {
      "click button": "authSubmit"
    },
    initialize: function() {
    },
    render: function() {
    },
    authSubmit: function() {
      $.ajax({
        type: 'POST',
        url: 'http://da.pantoto.org/api/user',
        data: {'usertel': $('#phone-number').val()},
        success: function(response) {
          console.log(response);
        },
        error: function() {
          console.log("caught error");
        }

      });

    }
});


//upload audio url view
var uploadUrl = Backbone.View.extend({
  el: "#upload-form",
    events: {
      "click button" : "submitUrl"
    }, 
    initialize: function() {
      this.url = $('#upload-input').val();
      console.log(this.url);
    },
    render: function() {
    },
    submitUrl: function(event) {
      event.preventDefault();
      if(this.url){
      $.ajax({
        type: 'POST',
        url: 'http://da.pantoto.org/api/url',
        data: {'url': this.url },
        success: function(response) {
          console.log(response);
        },
        error: function() {
          console.log("caught error");
        }

      });
      }
    }
});
//Audio play area - to listen audio
//add tags, name category
//TODO: should listen to tag clouds 
var audioPlayArea = Backbone.View.extend({
  el: "#audio-play-area",
    events: {
      "click #submit-form" : "submitForm",
    "click #cancel-form" : "toggle"
    },
    initialize: function(options) {
      this.model.on('change', this.render, this);
      this.collection = new audioCollection({ url: "http://da.pantoto.org/api/tags/"+this.model.get('id')});
      this.render();
    },
    template: _.template($('#play-item-template').html()),
    render: function() {
      this.$el.html('');
      this.$el.append(this.template(this.model.toJSON()));
      this.$tags = this.$el.find('input');
      this.$tags.tagsinput();
      //TODO: should figure our how to get inputs and build array


    },
    //to get the tags value from DOM input and post to Server endpoint
    submitForm: function(event) {
      event.preventDefault();
     //this.tempTags = [this.$tags.tagsinput('items')]//{'suggest': [this.$tags.val()], 'User': '+91-9035290792'}
     //console.log(this.tempTags);
     this.newTags = this.$tags.val();
     this.tags = this.model.get("tags");
     this.tags.push(this.newTags);
     this.model.set('tags', this.tags);
     console.log(this.model);
     this.collection.add(this.model);
      console.log(this.model, this.collection, "playarea");
      $.ajax({
        type: 'POST',
        url: this.collection.url,
        data: {'tags': this.model.get('tags')},
        success: function(response) {
          console.log(response);
        },
        error: function() {
          console.log("caught error");
        }

      });
      this.render();     

    },
    toggle: function() {
      if(this.$el.is(':visible')) {
        this.$el.hide();
        console.log("visible");
      }
      else {
        this.$el.show();
        console.log("hidden");
      }
    }

});

//Get request from the server endpoint
//api: 
// list view for the audio files, sorted by date-time stamp
// with other attributes from database
var dashboardview = Backbone.View.extend({
    events: {
      "click .recent-feed-data" : "playClick",
    "click .add-tag-button" : "playClick",
    "click .fav-button" : "favClick",
    "click .share-button" : "shareClick",
    "click .dislike-button" : "dislikeClick"
    },
    initialize: function(options) {
      this.$sideMenu = $("#side-menu-wrap");
      this.collection.fetch({
        success: function(collection, response) {
          console.log(collection, response.files);
          collection.set(response.files);
          audioTagApp.dashboard.render()
        },
        error: function(collection) {
        console.log("Error!! Error!!", collection)
        }
      });
    },
    template: _.template($('#audio-item-template').html()),
    render: function() {
      this.collection.each(function(item) {
        this.$el.append(this.template(item.toJSON()));
      }, this);
       $('[data-toggle="tooltip"]').tooltip();
       this.$sideMenu.BootSideMenu({
         side: "right",
         autoClose: true});
    },
    toggle: function() {
      if(this.$el.is(':visible')) {
        this.$el.hide();
        console.log("visible");
      }
      else {
        this.$el.show();
        console.log("hidden");
      }
    },
    playClick: function(event) {
      event.preventDefault();
      this.playArea = new audioPlayArea({model: this.collection.get($(event.currentTarget).data("id"))});
      this.toggle();
    },
    favClick: function(event) {
      var data = $(event.currentTarget).data('like');
      console.log("like", data);
    },
    shareClick: function(event) {
      var data = $(event.currentTarget).data('forward');
      console.log("forward", data);
    },
    dislikeClick: function(event) {
      var data = $(event.currentTarget).data('dislike');
      console.log("dislike", data);
    },


});


//Feed footer view to update state of Like, unlike and forward features
//A model of boolean states of each feature"

var feedFooterView = Backbone.View.extend({
  className: ".post-card-footer"

});

//visualization for tags, user and other file attributes
// to be extended with drag and drop to tagsinput field
var tagCloudView = Backbone.View.extend({
  el: "#tag-cloud",
    events: {
      "click span" : "searchTag"
    },
  initialize: function() {
    this.$tagClouds = $("#tag-clouds");
    this.$searchContainer = $("#search-results-container");
    this.tagSearchTemplate = _.template($('#search-results-template').html());
    this.collection.fetch({
      success: function(collection, response) {
        console.log(collection, response.files);
        collection.set(response.files);
        audioTagApp.tagCloud.render();
      },
      error: function(collection) {
        console.log("Error!! Error!!", collection)
      }
    });
  },
    template: _.template($('#play-item-template').html()),
    render: function() {
      var wordArray = _.chain(this.collection.pluck('tags')).flatten().countBy().map(function(val, key) {
        return {text:key, weight:val};
      });
      this.$el.jQCloud(wordArray._wrapped,
        {
                colors: ["#000", "#999" ]
              });
      
    },
    searchTag: function(event) {
      event.preventDefault();
      this.$searchContainer.html('');
      //bug - need to fix
      audioTagApp.dashboard.toggle();
        var searchResults = this.collection.filter( function(item) {
        if(_.contains(item.get('tags'), $(event.currentTarget).text())){
         return item; 
        }
      });
        _.each(searchResults, function(item) {
          console.log(item);
          this.$searchContainer.append(this.tagSearchTemplate(item.toJSON()));
        }, this);

      console.log($(event.currentTarget).text());
      //new audioPlayArea({key: "tag", value: $(event.currentTarget).text()});
    }

});


var appview = Backbone.View.extend({
  tagName: "body",
    initialize: function(options) {
      console.log("hurrat");
      this.dashboard = new dashboardview({el:"#dashboard-body", collection: new audioCollection({ url: "http://da.pantoto.org/api/files"})});
      this.tagCloud = new tagCloudView({collection: new audioCollection({ url: "http://da.pantoto.org/api/files"})});
    }
});
var audioTagApp = new appview;
