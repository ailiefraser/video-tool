var aspect_ratio = 640 / 390;
var start_width = 640;
var fullscreen = false;
var seek_updater = undefined;

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
var seeking = false;
var duration = 0;
var playback_speed;
var seek_start;
var muted = false;
var current_video = '';

function makeTimeString(time) {
	if (time) {
		var hours = Math.floor(time / 3600);
		var remaining = time - (hours * 3600);
		var minutes = Math.floor(remaining / 60);
		var seconds = remaining - (minutes * 60);
	} else {
		var hours = 0;
		var minutes = 0;
		var seconds = 0;
	}
	
	return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
	if ($("#current_video").length) {
		current_video = $("#current_video").html();
		player = new YT.Player('player', {
		width: start_width,
			height: start_width / aspect_ratio,
			videoId: current_video,
			playerVars: { 'showinfo': 0, 'rel': 0, 'disablekb': 1, 'controls': 0, 'cc_load_policy': 1 },
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			}
		});
	}
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	initButtons();
	iframe = $('#player');
	//event.target.playVideo();
	playback_speed = player.getPlaybackRate();
	updatePlaybackSpeedDisplay(playback_speed);
	duration = Math.floor(player.getDuration());
	$("#total_time").html(makeTimeString(duration));
	$("#current_time").html(makeTimeString(Math.floor(player.getCurrentTime())));
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
		$("#mask_text").hide();
		console.log("playing");

		seek_updater = setInterval(updateSeekBar, 100);
	}
	if (state == YT.PlayerState.CUED || duration == 0) {
		duration = Math.floor(player.getDuration());
		$("#total_time").html(makeTimeString(duration));

		$("#submit_url").attr("disabled", false);
		$("#submit_url").html("Submit");
	}
	if (state == YT.PlayerState.ENDED) {
		saveEvent('video ended', player.getCurrentTime());
	} else if (state == YT.PlayerState.CUED) {
		$("#mask_text").show();
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
			$(this).css("font-weight", "bold");
		} else {
			$(this).css("font-weight", "normal");
		}
	});
}

// not currently used, doesn't work
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

	$("#player_mask").width($("#player").width());
	$("#player_mask").height($("#player").height());

	$("#video_controls").offset(
		{"left": $("#player").offset().left, 
		"top": $("#player").offset().top + $("#player").height() });

	$("#player_mask").css("top", $("#player").position().top);
	$("#player_mask").css("left", $("#player").position().left);

	$("#restart_button").height($("#playback_dropdown button").height());
	$("#play_button").height($("#playback_dropdown button").height());
	$("#mute_button").height($("#playback_dropdown button").height());
	$("#size_button").height($("#playback_dropdown button").height());

	//$("#heatmap_container").css("background-color", "gray");
	//$("#heatmap_container").height($("#seek_bar").outerHeight());
	$("#heatmap_container").width($("#seek_bar").width());
	$("#heatmap_container").offset(
		{"left": $("#seek_bar").offset().left, 
		"top": $("#seek_bar").offset().top + 10});

	$(".heatmap_element").each(function() {
		var new_color = getGradientValue(parseFloat($(this).attr("data-color")));
		$(this).width(($("#heatmap_container").width() / 100));
		$(this).offset({"left": ($("#heatmap_container").width() / 100) * $(this).attr("data-left")});
		$(this).css("background-color", new_color);
		$(this).css("box-shadow", "0 0 5px 5px " + new_color);
	});
}

function saveEvent(event, video_time, new_video_time) {
	// nope no saving this is analysis version
}

// adapted from http://www.andrewnoske.com/wiki/Code_-_heatmaps_and_color_gradients
function getGradientValueSimple(value) {
	var aR = 0;   var aG = 255; var aB = 255;  // RGB for our 1st color (blue in this case).
	var bR = 255; var bG = 0; var bB = 0;    // RGB for our 2nd color (red in this case).

	var red   = Math.round((bR - aR) * value + aR);      // Evaluated as -255*value + 255.
	var green = Math.round((bG - aG) * value + aG);      // Evaluates as 0.
	var blue  = Math.round((bB - aB) * value + aB);      // Evaluates as 255*value + 0.
	return `rgba(${red}, ${green}, ${blue}, 1)`;
}

function getGradientValue(value) {
	var NUM_COLORS = 5;
	var color = [ [0,0,255], [0,255,255], [0,255,0], [255,255,0], [255,0,0] ];
	// A static array of 5 colors:  (blue, cyan,  green,  yellow,  red) using {r,g,b} for each.

	var idx1; var idx2; 
	var fractBetween = 0.0;

	if(value <= 0) {
		idx1 = 0; 
		idx2 = 0;
	} else if (value >= 1) {
		idx1 = NUM_COLORS-1;
		idx2 = NUM_COLORS-1; 
	} else {
		value = value * (NUM_COLORS-1);        // Will multiply value by 4.
		console.log(value);
		idx1  = Math.floor(value);                  // Our desired color will be after this index.
		console.log(idx1);
		idx2  = idx1+1;                        // ... and before this index (inclusive).
		console.log(idx2);
		fractBetween = value - parseFloat(idx1);    // Distance between the two indexes (0-1).
	}

	var red   = Math.round((color[idx2][0] - color[idx1][0])*fractBetween + color[idx1][0]);
	var green = Math.round((color[idx2][1] - color[idx1][1])*fractBetween + color[idx1][1]);
	var blue  = Math.round((color[idx2][2] - color[idx1][2])*fractBetween + color[idx1][2]);
	//console.log(`rgba(${red}, ${green}, ${blue}, 1)`);
	return `rgba(${red}, ${green}, ${blue}, 1)`;
}

function togglePlayPause() {
	var state = player.getPlayerState();
	if (state == YT.PlayerState.PAUSED || state == YT.PlayerState.ENDED || state == YT.PlayerState.CUED) {
		saveEvent('play video', player.getCurrentTime());
		player.playVideo();
	} else if (state == YT.PlayerState.PLAYING || state == YT.PlayerState.BUFFERING) {
		saveEvent('pause video', player.getCurrentTime());
		player.pauseVideo();
	}
}

function initButtons() {

	updateSizes();

	$( window ).resize(function() {
		updateSizes();
	});

	// Initialize play/pause button
	$("#play_button").click(togglePlayPause);
	$("#player_mask").click(togglePlayPause);

	// Initialize restart button
	$("#restart_button").click(function() {
		saveEvent('restart video', player.getCurrentTime(), 0);
		player.seekTo(0);
		player.playVideo();
	});

	// Initialize mute button
	$("#mute_button").click(function() {
		if (player.isMuted()) {
			// unmute
			player.unMute();
			$(this).children("span").removeClass("glyphicon-volume-off");
			$(this).children("span").addClass("glyphicon-volume-up");
			$("#volume_bar").val(player.getVolume());
			muted = false;
			saveEvent('unmute audio', player.getCurrentTime());
		} else {
			// mute
			player.mute();
			$(this).children("span").removeClass("glyphicon-volume-up");
			$(this).children("span").addClass("glyphicon-volume-off");
			$("#volume_bar").val(0);
			muted = true;
			saveEvent('mute audio', player.getCurrentTime());
		}
		
	});

	$("#volume_bar").on("input change", function() {
		var new_vol = $(this).val();
		if (new_vol > 0 && muted) {
			player.unMute();
			saveEvent('unmute audio', player.getCurrentTime());
			muted = false;
			$("#mute_button span").removeClass("glyphicon-volume-off");
			$("#mute_button span").addClass("glyphicon-volume-up");
		} else if (new_vol == 0 && !muted) {
			saveEvent('mute audio', player.getCurrentTime());
			muted = true;
			$("#mute_button span").addClass("glyphicon-volume-off");
			$("#mute_button span").removeClass("glyphicon-volume-up");
		}
		player.setVolume(new_vol);
	});

	// Initialize playback speed buttons
	var speeds = player.getAvailablePlaybackRates();
	$("#playback_select").html("");
	speeds.forEach(function(speed) {
		$("#playback_select").append("<li><a data-speed='" + speed + "' href='#'>" + speed + "</a></li>");
	});

	$("#playback_select a").click(function() {
		var cur_time = player.getCurrentTime();
		var new_speed = Number($(this).attr("data-speed"));
		player.setPlaybackRate(new_speed);
		playback_speed = new_speed;
		updatePlaybackSpeedDisplay(new_speed);
		saveEvent('change speed', cur_time);
	});

	// Initialize seek slider

	$("#seek_bar").mousedown(function() {
		seek_start = player.getCurrentTime();
		seeking = true;
	});

	$("#seek_bar").on("input change", function() {
		seeking = true;
		var position = $(this).val();
		player.seekTo((player.getDuration() / 100) * position);
	});

	$("#seek_bar").on("change", function() {
		var position = $(this).val();
		var seek_end = (player.getDuration() / 100) * position;
		player.seekTo(seek_end);
		seeking = false;
		saveEvent("seek video", seek_start, seek_end);
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
		saveEvent('change screen size', player.getCurrentTime());
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
				current_video = url.slice(v_index + "youtube.com/watch?v=".length).split("&")[0];
				console.log(current_video);
				saveEvent('load video', player.getCurrentTime());
				player.cueVideoById(current_video);
			} else {
				alert("Please paste in a properly formatted youtube URL, e.g. https://www.youtube.com/watch?v=SoBAQgl0zbo");
			}
		}
	});
}