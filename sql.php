<?php
$lifetime = 15 * 60;
$path = "/";
$domain = "";
$secure = TRUE;
$httponly = TRUE;
session_set_cookie_params($lifetime, $path, $domain, $secure, $httponly);
session_start();
if (isset($_POST["username"]) and isset($_POST["password"]))
        if (checklogin_mysql($_POST["username"],$_POST["password"])) {
            $_SESSION['authenticated'] = TRUE;
            $_SESSION['username'] = $_POST["username"];
            $_SESSION['browser'] = $_SERVER["HTTP_USER_AGENT"];
        }else{
            session_destroy();
            echo "<script>alert('Invalid username/password');window.location='file_name';</script>";
            die();
        }
    if (!isset($_SESSION['authenticated']) or $_SESSION['authenticated']!= TRUE) {
        session_destroy();
        echo "<script>alert('You have not login. Please login first!');</script>";
        header("Refresh: 0; url=file_name");
        die();
    }
        if($_SESSION["browser"] != $_SERVER["HTTP_USER_AGENT"]){
        session_destroy();
        echo "<script>alert('Session hijacking attack is detected!');</script>";
        header("Refresh:0; url=file_name");
        die();
    }

    if (!isset($_SESSION["nocsrftoken"])) {
    $_SESSION["nocsrftoken"] = bin2hex(random_bytes(16));
    }

function checklogin_mysql($username, $password)
{
    $mysqli = new mysqli('localhost', 'SQLusername', 'password', 'database_name');
    if ($mysqli->connect_errno) {
        printf("Database connection failed: %s\n", $mysqli->connect_error);
        exit();
    }
    $sql = "SELECT * FROM users WHERE username=? AND password = md5(?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("ss", $username, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows >= 1)
        return TRUE;
    return FALSE;
}
