// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

var aspect_ratio = 640 / 390;
var start_width = 640;
var fullscreen = false;
var seek_updater = undefined;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
var seeking = false;
var duration = 0;

function makeTimeString(time) {
	var hours = Math.floor(time / 3600);
	var remaining = time - (hours * 3600);
	var minutes = Math.floor(remaining / 60);
	var seconds = remaining - (minutes * 60);
	return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		width: start_width,
		height: start_width / aspect_ratio,
		videoId: 'XtlLI_pBC3s',
		playerVars: { 'showinfo': 0, 'rel': 0},// 'controls': 0 },
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	initButtons();
	iframe = $('#player');
	//event.target.playVideo();
	var playback_speed = player.getPlaybackRate();
	updatePlaybackSpeedDisplay(playback_speed);
	duration = Math.floor(player.getDuration());
	$("#total_time").html(makeTimeString(duration));

}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
	var state = player.getPlayerState();
	//console.log(state);
	if (state == YT.PlayerState.PAUSED || state == YT.PlayerState.ENDED || state == YT.PlayerState.CUED) {
		$("#play_button span").removeClass("glyphicon-pause");
		$("#play_button span").addClass("glyphicon-play");
		console.log("paused");
		if (seek_updater != undefined) {
			clearInterval(seek_updater);
		}
	} else if (state == YT.PlayerState.PLAYING || state == YT.PlayerState.BUFFERING) {
		$("#play_button span").removeClass("glyphicon-play");
		$("#play_button span").addClass("glyphicon-pause");
		console.log("playing");

		seek_updater = setInterval(updateSeekBar, 100);
	}
	if (state == YT.PlayerState.CUED || duration == 0) {
		duration = Math.floor(player.getDuration());
		$("#total_time").html(makeTimeString(duration));

		$("#submit_url").attr("disabled", false);
		$("#submit_url").html("Submit");
	}

	// update seek bar
	updateSeekBar();
}

function updateSeekBar() {
	if (!seeking) {
		if (player.getDuration() == 0) {
			var value = 0;
		} else {
			var value = (100 / player.getDuration()) * player.getCurrentTime();
		}
		$("#seek_bar").val(value);
	}
	// also update time
	$("#current_time").html(makeTimeString(Math.floor(player.getCurrentTime())));
}

function updatePlaybackSpeedDisplay(speed) {
	$("#playback_select a").each(function() {
		if (Number($(this).attr("data-speed")) == speed) {
			console.log("EQUAL TO " + speed);
			$(this).css("font-weight", "bold");
		} else {
			$(this).css("font-weight", "normal");
		}
	});
}

function playFullScreen() {
	console.log(iframe);
	var requestFullScreen = iframe.requestFullScreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullScreen;
	console.log(requestFullScreen);
	if (requestFullScreen) {
		requestFullScreen.bind(iframe)();
	}
}

function updateSizes() {
	$("#video_controls").width($("#player").width());
	$("#seek_bar").width($("#player").width());
	$("#video_controls").offset({"left": $("#player").offset().left});
}



function initButtons() {

	updateSizes();

	// Initialize play/pause button
	$("#play_button").click(function() {
		var state = player.getPlayerState();
		if (state == YT.PlayerState.PAUSED || state == YT.PlayerState.ENDED || state == YT.PlayerState.CUED) {
			player.playVideo();
			$.ajax({
	            type: "POST",
	            url: 'save.php',
	            data: { event:'play video' }
	        });
		} else if (state == YT.PlayerState.PLAYING || state == YT.PlayerState.BUFFERING) {
			player.pauseVideo();
		}
	});

	// Initialize restart button
	$("#restart_button").click(function() {
		player.seekTo(0);
		player.playVideo();
	});

	// Initialize playback speed buttons
	var speeds = player.getAvailablePlaybackRates();
	$("#playback_select").html("");
	speeds.forEach(function(speed) {
		$("#playback_select").append("<li><a data-speed='" + speed + "' href='#'>" + speed + "</a></li>");
	});

	$("#playback_select a").click(function() {
		var new_speed = Number($(this).attr("data-speed"));
		player.setPlaybackRate(new_speed);
		updatePlaybackSpeedDisplay(new_speed);
	});

	// Initialize restart button
	$("#fullscreen_button").click(function() {
		playFullScreen();
	});

	// Initialize seek slider
	$("#seek_bar").on("input change", function() {
		seeking = true;
		var position = $(this).val();
		player.seekTo((player.getDuration() / 100) * position);
	});

	$("#seek_bar").on("change", function() {
		var position = $(this).val();
		player.seekTo((player.getDuration() / 100) * position);
		seeking = false;
	});

	// Initialize fullscreen button
	$("#size_button").click(function() {
		if (!fullscreen) {
			var new_width = $("#video_container").width();
			$(this).children("span").removeClass("glyphicon-fullscreen");
			$(this).children("span").addClass("glyphicon-resize-small");
			fullscreen = true;
		} else {
			var new_width = start_width;
			$(this).children("span").addClass("glyphicon-fullscreen");
			$(this).children("span").removeClass("glyphicon-resize-small");
			fullscreen = false;
		}
		player.setSize(new_width, new_width / aspect_ratio);
		updateSizes();
	});

	$("#submit_url").click(function() {
		var url = $("#youtube_url").val();
		if (url != "") {
			$(this).attr("disabled", true);
			$(this).html("Loading...");
			var v_index = url.indexOf("youtube.com/watch?v=");
			if (v_index != -1) {
				var video_id = url.slice(v_index + "youtube.com/watch?v=".length).split("&")[0];
				console.log(video_id);
				player.cueVideoById(video_id);
			} else {
				alert("Please paste in a properly formatted youtube URL, e.g. https://www.youtube.com/watch?v=SoBAQgl0zbo");
			}
		}
	});

}