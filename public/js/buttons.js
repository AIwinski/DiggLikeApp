 $(function(){
    $(".voteUp").click(function(e){
      e.preventDefault();

      if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }

      var data = {
        id: $(this).attr("id")
      }
      var up = "#" + data.id + ".voteUp";
      var down = "#" + data.id + ".voteDown";

      $.ajax({
        type: "POST",
        url: "/posts/vote/" + $(this).attr("id") + "/up",
        data: data,
        success: function(data){
          if(data.success){
            if($(up).hasClass("clicked")){
              $(up).removeClass("clicked");
            } else {
              $(up).addClass("clicked");
              $(down).removeClass("clicked");
            }

          } else {
          }
        },
        error: function(){
          alert("blad");
        }
      });

    });

    $(".voteDown").click(function(e){
      e.preventDefault();

      if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }

      var data = {
        id: $(this).attr("id")
      }
      
      var up = "#" + data.id + ".voteUp";
      var down = "#" + data.id + ".voteDown";

      $.ajax({
        type: "POST",
        url: "/posts/vote/" + $(this).attr("id") + "/down",
        data: data,
        success: function(data){
          if(data.success){
            if($(down).hasClass("clicked")){
              $(down).removeClass("clicked");
            } else {
              $(down).addClass("clicked");
              $(up).removeClass("clicked");
            }
          } else {
          }
        },
        error: function(){
          alert("blad");
        }
      });

    });

      $(".fav").click(function(e){
        e.preventDefault();


        if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }
        
        var data = {
            id: $(this).attr("id")
          }

          var fav = "#" + data.id + ".fav";

          $.ajax({
            type: "POST",
            url: "/posts/fav",
            data: data,
            success: function(data){
              if(data.success){
                $(fav).toggleClass("clicked");
              } else {
              }
            },
            error: function(){
              alert("blad");
            }
          });
      });
  });