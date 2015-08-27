(function(window) {

    window.audioSwtr = window.audioSwtr || {};

    //init App
    audioSwtr.init = function() {
        $.ajaxSetup({
            xhrFields: {
                // we need this to send cookies to cross-domain requests
                withCredentials: true
            },
            //some browsers won't make cross-domain ajax until it is explicitly set
            crossDomain: true
        });
        this.handleOAuth();
    };


    audioSwtr.handleOAuth = function() {
        if(audioSwtr.access_token) {
            $('#signinview').html('Signing you in..');
            $.ajax({
            url: audioSwtr.swtstoreURL()+'/api/users/me?access_token='+
                audioSwtr.access_token,
            success: function(data) {
                audioTagApp.userLoggedIn(data.username);
                console.log(data.username);
            },
            error: function() {
                $('#signinview').html('Error signing in! Please try again');
            }
        });
    }
};

  /* Model for audio Annotation Sweets */
  var AudioAnnoSwt = Backbone.Model.extend({
    defaults: {
      'who': '',
      'what': 'img-anno',
      'where': '',
      'how': {}
    },
    initialize: function() {
    }
  });

  /* Collection to hold all multiple ImgAnnoSwt */
  audioSwtr.AudioAnnoSwts = Backbone.Collection.extend({
    model: AudioAnnoSwt,
    url: function() {
      return audioSwtr.swtstoreURL() + '/sweets';
    },
    // get all sweets/annotations of type #img-anno for a particular URI
    // (where)
    // @options is a javascript object,
    // @options.where : URI of the resource for which swts to be fetched
    // @options.who: optional username to filter sweets
    // @options.success: success callback to call
    // @options.error: error callback to call
    getAll: function(options) {
      // error checking
      if(!options.where) {
        throw Error('"where" option must be passed to get sweets of a URI');
        return false;
      }
      // setting up params
      var where = options.where,
          what = options.what || null;
      who = options.who || null;

      url = audioSwtr.swtstoreURL() + audioSwtr.endpoints.get + '?where=' +
        encodeURIComponent(where);// '&access_token=' + swtr.access_token;

      if(who) {
        url += '&who=' + who;
      }
      if(what) {
        url += '&what=' + what;
      }
      // get them!
      this.sync('read', this, {
        url: url,
        success: function() {
          if(typeof options.success === 'function') {
            options.success.apply(this, arguments);
          }
        },
        error: function() {
          if(typeof options.error === 'function') {
            options.error.apply(this, arguments);
          }
        }
      });
    },
    // post newly created sweets to a sweet store
    // @options is a javascript object,
    // @options.where : URI of the resource for which swts to be fetched
    // @options.who: optional username to filter sweets
    // @options.success: success callback to call
    // @options.error: error callback to call,
    post: function(options) {
      var new_sweets = this.getNew();
      var dummy_collection = new Backbone.Collection(new_sweets);
      console.log('swts to be posted', dummy_collection.toJSON());

      if(!audioSwtr.access_token) {
        throw new Error('Access Token is required to sweet');
        return;
      }

      var url = audioSwtr.swtstoreURL() + audioSwtr.endpoints.post +
        '?access_token=' + audioSwtr.access_token;

      this.sync('create', dummy_collection, {
        url: url,
        success: function() {
          if(typeof options.success === 'function') {
            options.success.apply(this, arguments);
          }
        },
        error: function() {
          if(typeof options.error === 'function') {
            options.error.apply(this, arguments);
          }
        }
      });
    },
    // return newly created models from the collection
    getNew: function() {
      var new_models = [];
      this.each(function(model) {
        if(model.isNew()) {
          new_models.push(model);
        }
      });
      return new_models;
    },
    // update part of the collection after a save on the server
    update: function() {
    }
  });

    //testing audioSwtr
    audioSwtr.playArea = Backbone.View.extend({
        events: {
        },
        initialize: function() {
            this.collection = new audioSwtr.AudioAnnoSwts();
            this.listenTo(this.collection, 'add', this.render);
        },
        render: function() {
            console.log(this.collection);
        }
    });

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
            "change input" : "emojiChange",
            "click .suggest-tag-item" : "addTagViz",
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
            $("body").scrollTop(0); //this.$el should do this, but unable to get it working
            //TODO: should figure our how to get inputs and build array
            this.$tags = this.$el.find('input');
            this.$tags.tagsinput();


        },

            //Visual input for tags - emojione
        emojiChange: function(event) {
            console.log("need to complete this");
        },
            //Add tag bby click - Future features should have vizual tag input
            //against the text tag input

        addTagViz: function(event) {
            event.preventDefault();
            this.$el.find('input').val($(event.currentTarget).text().slice(11));
        },
            //to get the tags value from DOM input and post to Server endpoint
        submitForm: function(event) {
            event.preventDefault();
            //this.tempTags = [this.$tags.tagsinput('items')]//{'suggest': [this.$tags.val()], 'User': '+91-9035290792'}
            //console.log(this.tempTags);
            this.newTags = this.$tags.tagsinput('items');
            console.log(this.newTags);
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
                    audioTagApp.dashboard.render();
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

    var searchTagView = Backbone.View.extend({
        el: "#search-results-container",
        template: _.template($('#search-results-template').html()),
        events: {
            "click .recent-feed-data": "callPlayArea"
        },
        initialize: function(options) {
            //_.bindAll(this, 'callPlayArea');
            this.keyword = options.keyword || '';
            this.collection = new audioCollection({ url: "http://da.pantoto.org/api/files"});
            this.collection.fetch({
                success: function(collection, response) {
                    console.log(collection, response.files);
                    collection.set(response.files);
                    audioTagApp.tagCloud.searchView.render();

                },
                error: function(collection) {
                    console.log("Error!! Error!!", collection)
                }
            });
        },
        render: function() {
            $(this.el).html('');
            this.searchResults = this.collection.filter( function(item) {
                console.log(this.keyword);
                if(_.contains(item.get('tags'), this.keyword )){
                    return item; 
                }
            }, this);
            //bug - need to fix
            if(audioTagApp.dashboard.$el.is(':visible')) {
                audioTagApp.dashboard.toggle();
            }
            /*if(audioTagApp.dashboard.playArea.$el.is(':visible')) {
              audioTagApp.dashboard.playArea.toggle();
              }*/
            _.each(this.searchResults, function(item) {
                $(this.el).append(this.template(item.toJSON()));
            }, this);
        },
        callPlayArea: function(event) {
            event.stopPropagation();
            this.toggle();
            new audioPlayArea({model: this.collection.get($(event.currentTarget).data("id"))});
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


//visualization for tags, user and other file attributes
// to be extended with drag and drop to tagsinput field
    var tagCloudView = Backbone.View.extend({
        el: "#tag-cloud",
        events: {
            "click span" : "searchTag"
        },
        initialize: function() {
            this.$tagClouds = $("#tag-clouds");
            // this.$searchContainer = $("#search-results-container");
            // this.tagSearchTemplate = _.template($('#search-results-template').html());
            this.listenTo(this.collection, "change", this.render);
            this.collection.fetch({
                success: function(collection, response) {
                    console.log(collection, response.files);
                    collection.set(response.files);
                    audioTagApp.tagCloud.render();
                },
                error: function(collection) {
                    console.log("Error!! Error!!", collection)
                }
            }, this);
        },
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

            this.searchView = new searchTagView({keyword : ($(event.currentTarget).text())});
        }

    });

    var appview = Backbone.View.extend({
        el: $('body'),
        events:{
            "click #homeAnchor": "callDashboard",
            'click #sign-in': 'signIn'
        },
        initialize: function(options) {
            _.bindAll(this, 'callDashboard');

            // initialize the oauth stuff
            this.oauth = new Oauth({
                app_id: audioSwtr.app_id,
                endpoint: audioSwtr.swtstoreURL() + audioSwtr.endpoints.auth,
                redirect_uri: audioSwtr.oauth_redirect_uri,
                scopes: 'email,sweet,context'
            });
            this.render();
        },
        render: function(){
            this.dashboard = new dashboardview({el:"#dashboard-body",
                collection: new audioCollection({ url: "http://da.pantoto.org/api/files"})});
            this.tagCloud = new tagCloudView({collection: new audioCollection({ url: "http://da.pantoto.org/api/files"})});
        },
        signIn: function(event) {
            event.preventDefault();
            console.log("calling sign in");
            // if user is Guest.. sign them in..
            // if(audioSwtr.who === 'Guest') {
            //     console.log("authorizing");
            this.oauth.authorize();
            // }
            // return false;
        },
        userLoggedIn: function(username) {
            audioSwtr.who = username;
            var text = 'Signed in as <b><u>' + audioSwtr.who + '</u></b>';
            $('#signinview').html(text);
        },
        userLoggedOut: function() {
            swtr.who = 'Guest';
            $('#signinview').html('Logged out');
        },
        callDashboard: function(event) {
            if(audioTagApp.dashboard.$el.is(':hidden')) {
                audioTagApp.dashboard.toggle();
                audioTagApp.tagCloud.searchView.$el.html('');
            }
        }
    });
    audioTagApp = new appview;

window.onload = function() {
    audioSwtr.init();
};
})(window);
