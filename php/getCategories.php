<?php 
  header('Access-Control-Allow-Origin: *'); 
  header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
  
  $bd = include_once "conexion.php";
  $sentencia = $bd->query("SELECT codigo, tipo FROM categoria");
  $categorias = $sentencia->fetchAll(PDO::FETCH_OBJ);  
  echo json_encode($categorias);
?>