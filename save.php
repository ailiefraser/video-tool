<?php

if (isset($_POST['event'])) {

	$event_headers = array("user ID", "time", "video", "event", "video time", "new video time", "playback speed", "screen mode");

	if (file_exists("data/events.csv")) {
		$event_data = array();
	} else {
		$event_data = array($event_headers);
	}

	array_push($event_data, array($_SESSION['id'], date(), $_SESSION['current_video'], $_POST['event'], "", "", "", ""));

	$events_file = fopen("data/video_events.csv", "a");

	foreach ($event_data as $line) {
		fputcsv($events_file, $line);
	}
	fclose($events_file);
} else {
	echo "no event sent";
	echo $_SESSION['id'];
	echo $_SESSION['current_video'];
}

?>