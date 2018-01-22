<?php

session_start();

if (isset($_POST['event'])) {

	$event_headers = array("user ID", "time", "video", "event", "video time", "new video time", "playback speed", "screen mode");

	if (file_exists("data/events.csv")) {
		$event_data = array();
	} else {
		$event_data = array($event_headers);
	}

	array_push($event_data, array($_SESSION['id'], date('c'), $_SESSION['current_video'], $_POST['event'], 
		$_POST['video_time'], "", $_POST["playback_speed"], $_POST["screen_mode"]));

	//var_dump($event_data);

	$events_file = fopen("data/events.csv", "a");

	if ($events_file) {
		foreach ($event_data as $line) {
			fputcsv($events_file, $line);
		}
	}
	fclose($events_file);
}

?>