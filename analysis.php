<?php

session_start();

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
	<div id="body_container">
		<div id="video_header">
			<h3>Video analysis</h3>
			<div>
				<p>Select a video to view analytics for:</p>
				<?php
					// insert video options here
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
								array_push($videos, $event["video"]);
							}
						}

						foreach ($videos as $video) {
							?>
							<button id=<?php echo $video ?> type="button" class="btn btn-default">
								<?php echo $video ?>
							</button>
							<?php
						}
					}
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
		  	</div>
		</div>
	</div>
</body>
</html>