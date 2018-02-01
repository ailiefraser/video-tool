<?php

session_start();

$api_key = file_get_contents("api_key.txt");

if (isset($_POST['video'])) {

	$cur_video = $_POST['video'];

	if (file_exists("data/events.csv")) {
		$events_file = fopen("data/events.csv", "r");
		$events = array();
		$events_header = null;
		while ($row = fgetcsv($events_file)) {
			if ($events_header === null) {
		        $events_header = $row;
		        continue;
		    }
		    $events[] = array_combine($events_header, $row);
		}
		fclose($events_file);

		$videos = array();
		$users = array();
		
		foreach ($events as $event) {
			if (!in_array($event["user ID"], $users)) {
				array_push($users, $event["user ID"]);
			}

			if (!in_array($event["video"], $videos)) {
				$videos[$event["video"]] = array();
			}
		}

		$user_data = array();

		// get all events from this video, organized by user
		foreach ($users as $user) {
			$user_playing = false;
			$start_time = 0;
			foreach ($events as $event) {
				if (strcmp($event["video"], $cur_video) == 0 && strcmp($event["user ID"], $user) == 0) {
					// it's this user
					if (!$user_playing && in_array($event["event"], array("play video", "restart video"))) {
						// if user was not playing and this is a play event
						if (strcmp($event["event"], "play video") == 0) {
							$start_time = $event["video time"];
						} else {
							$start_time = $event["new video time"];
						}
						$cur_video = $event["video"];
						$user_playing = true;
					} else if ($user_playing && 
						in_array($event["event"], array("load video", "pause video", "video ended", "restart video", "seek video"))) {
						// if user was playing and this event stopped it
						if (!isset($user_data[$user])) {
							$user_data[$user] = array();
						}
						array_push($user_data[$user], 
							array("start_time" => $start_time, "end_time" => $event["video time"], "video" => $cur_video));
						if (in_array($event["event"], array("restart video", "seek video"))) {
							// user is still playing but started from a new spot
							$start_time = $event["new video time"];
						} else {
							// user stopped playing
							$user_playing = false;
						}
					}
				}
			}
		}
		// // get all events from this video in order they happened 
		// $video_events = array();
		// foreach ($events as $event) {
		// 	if (strcmp($event["video"], $cur_video) == 0) {
		// 		array_push($video_events, $event);
		// 	}
		// }

		//var_dump($user_data);
	}
} else {
	if (file_exists("data/events.csv")) {
		$events_file = fopen("data/events.csv", "r");
		$events = array();
		$events_header = null;
		while ($row = fgetcsv($events_file)) {
			if ($events_header === null) {
		        $events_header = $row;
		        continue;
		    }
		    $events[] = array_combine($events_header, $row);
		}
		fclose($events_file);

		$videos = array();
		
		foreach ($events as $event) {
			if (!in_array($event["video"], $videos)) {
				$videos[$event["video"]] = array();
			}
		}
	} else {
		$videos = array();
	}
}

$json = file_get_contents(
	'https://www.googleapis.com/youtube/v3/videos?id='.implode(",", array_keys($videos)).
	'&key='.$api_key.'&part=snippet,contentDetails');
$ytdata = json_decode($json);

$i = 0;
foreach ($videos as $video=>$video_info) {
	$videos[$video]["title"] = $ytdata->items[$i]->snippet->title;
	$duration_obj = new DateInterval($ytdata->items[$i]->contentDetails->duration);
	$videos[$video]["duration"] = ($duration_obj->h * 3600) + ($duration_obj->i * 60) + $duration_obj->s;
	$i++;
}
//var_dump($videos);


// "user ID",time,video,event,"video time","new video time","playback speed","screen mode"
?>

<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
	<meta name="description" content="">
	<meta name="author" content="">

	<link rel="stylesheet" href="css/bootstrap.min.css">
	<script src="js/jquery-3.2.1.min.js"></script>
	<script src="js/bootstrap.js"></script>
	
	<title>Video Analysis</title>

	<script src="js/analysis.js"></script>
	<link href="css/style.css" rel="stylesheet">

</head>
<div class="device-xs visible-xs"></div>
<div class="device-sm visible-sm"></div>
<div class="device-md visible-md"></div>
<div class="device-lg visible-lg"></div>
<body>
	<h3 id="main_title">Video analysis</h3>
	<div id="total_container">
		<div id="left_container">
			<div id="video_header">
				<div>
					<p>Select a video to view analytics for:</p>
					<?php
						// insert video options here
						foreach ($videos as $video=>$video_info) {
							?>
							<form id="video_choice_form" action="analysis.php" method="post">
								<button id=<?php echo $video ?> value=<?php echo $video ?> 
									type="submit" name="video" class="btn btn-default">
									<?php echo $video_info["title"] ?>
								</button>
							</form>
							<?php
						}
						//var_dump($user_data);
					?>
				</div>
			</div>
			<div id="video_container">
				<div id="player"></div>
				<div id="player_mask">
					<p id="mask_text">Click the play button below to play this video</p>
				</div>
				<div id="video_controls" class="controls">
					<button id="restart_button" type="button" class="btn btn-default" aria-label="Left Align">
						<span class="glyphicon glyphicon-repeat" aria-hidden="true"></span>
					</button>
				    <button id="play_button" type="button" class="btn btn-default" aria-label="Left Align">
						<span class="glyphicon glyphicon-play" aria-hidden="true"></span>
					</button>
					<button id="mute_button" type="button" class="btn btn-default" aria-label="Left Align">
						<span class="glyphicon glyphicon-volume-up" aria-hidden="true"></span>
					</button>
					<input type="range" id="volume_bar" value="100" readonly="">
					<button id="size_button" type="button" class="btn btn-default float-right" aria-label="Right Align">
						<span class="glyphicon glyphicon-fullscreen" aria-hidden="true"></span>
					</button>
					<span id="current_time"></span> / <span id="total_time"></span>
					<div id="playback_dropdown" class="dropdown float-right">
						<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
						Speed
							<span class="caret"></span>
						</button>
						<ul id="playback_select" class="dropdown-menu" aria-labelledby="dropdownMenu1">
							<li><a data-speed="1" href="#">1</a></li>
						</ul>
					</div>
				    <input type="range" id="seek_bar" value="0" readonly="" class="clear">
				    <div id="heatmap_container">
				    	<?php 
				    	$all_nums = array();
				    	for ($left = 0; $left <= 99; $left++) {
				    		echo "left: " . $left . "<br/>";
				    		$right = $left + 1;
				    		$num_events = 0;
				    		foreach ($user_data as $u=>$user_events) {
				    			echo "u: " . $u . "<br/>";
				    			foreach ($user_events as $index=>$event_info) {
				    				echo "index: " . $index . "<br/>";
				    				$start = intval($event_info["start_time"]);
				    				$end = intval($event_info["end_time"]);

				    				$start_location = round((100 / $videos[$cur_video]["duration"]) * $start);
				    				$end_location = round((100 / $videos[$cur_video]["duration"]) * $end);
				    				echo $start_location . ", " . $end_location . "<br/>";

				    				if ($start_location <= $left && $end_location >= $right) {
				    					$num_events++;
				    				}
				    			}
				    		}
				    		array_push($all_nums, $num_events);
				    	}
				    	//var_dump($all_nums);

				    	for ($i = 0; $i <= 99; $i++) {
				    		$all_nums[$i] = ($all_nums[$i] - min($all_nums)) / max($all_nums) - min($all_nums);
				    	}
				    	//var_dump($all_nums);


				    	foreach ($user_data as $u=>$user_events) {
				    		foreach ($user_events as $index=>$event_info) {
				    			$start = intval($event_info["start_time"]);
				    			$end = intval($event_info["end_time"]);

				    			$start_location = round((100 / $videos[$cur_video]["duration"]) * $start);
				    			$end_location = round((100 / $videos[$cur_video]["duration"]) * $end);
				    			$width = $end_location - $start_location;
				    			?>
				    			<div class="heatmap_element" 
				    				data-left=<?php echo $start_location ?>>
				    			</div>
				    			<?php
				    		}
				    	} ?>
				    </div>
			  	</div>
			</div>
		</div>
		<div id="right_container">
			<h4>Video stats:</h4>
			<?php if (isset($cur_video)) { ?>
				<p>Current video: <span id="current_video"><?php echo $cur_video ?></span></p>
				<p>Video title: <?php echo $videos[$cur_video]["title"]?></p>
				<p>Number of unique views: 
					<?php 
						echo sizeof($user_data);
					?>
			<?php } else { ?>
				<div>Choose a video on the left to view stats.</div>
			<?php } var_dump($user_data); ?>
		</div>
	</div>
</body>
</html>