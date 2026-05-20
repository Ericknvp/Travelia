CREATE DATABASE IF NOT EXISTS travelia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travelia_db;

CREATE TABLE usuarios (
    id_usuario           INT UNSIGNED      PRIMARY KEY AUTO_INCREMENT,
    nombre               VARCHAR(100)      NOT NULL,
    correo               VARCHAR(150)      UNIQUE NOT NULL,
    contrasena_hash      TEXT              NOT NULL,
    bio                  TEXT,
    ciudad               VARCHAR(100),
    pais                 VARCHAR(100)      DEFAULT 'Colombia',
    url_foto_perfil      TEXT,
    rol                  ENUM('usuario','empresario','admin') DEFAULT 'usuario',
    fecha_registro       TIMESTAMP         DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE negocios (
    id_negocio                   INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_usuario                   INT UNSIGNED NOT NULL,
    nombre                       VARCHAR(150) NOT NULL,
    tipo                         ENUM('hotel','restaurante') NOT NULL,
    descripcion                  TEXT,
    ciudad                       VARCHAR(100),
    pais                         VARCHAR(100) DEFAULT 'Colombia',
    direccion                    VARCHAR(200),
    url_foto_portada             TEXT,
    calificacion_promedio        DECIMAL(3,2) DEFAULT 0.00,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE publicaciones (
    id_publicacion               INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_usuario                   INT UNSIGNED NOT NULL,
    id_negocio                   INT UNSIGNED,
    id_negocio_etiquetado        INT UNSIGNED,
    titulo                       VARCHAR(150) NOT NULL,
    contenido                    TEXT         NOT NULL,
    categoria                    ENUM('tour','hospedaje','actividad','sitio_turistico','restaurante') NOT NULL,
    ciudad                       VARCHAR(100),
    pais                         VARCHAR(100),
    url_imagen                   TEXT,
    fecha_creacion               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario)              REFERENCES usuarios(id_usuario)  ON DELETE CASCADE,
    FOREIGN KEY (id_negocio)              REFERENCES negocios(id_negocio)  ON DELETE SET NULL,
    FOREIGN KEY (id_negocio_etiquetado)   REFERENCES negocios(id_negocio)  ON DELETE SET NULL
);

CREATE TABLE amistades (
    id_amistad           INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_solicitante       INT UNSIGNED NOT NULL,
    id_receptor          INT UNSIGNED NOT NULL,
    estado               ENUM('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
    fecha_solicitud      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta      TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (id_solicitante) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_receptor)    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_amistad (id_solicitante, id_receptor)
);

CREATE TABLE mesas (
    id_mesa          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_negocio       INT UNSIGNED NOT NULL,
    numero_mesa      INT          NOT NULL,
    capacidad        INT          NOT NULL CHECK (capacidad > 0),
    FOREIGN KEY (id_negocio) REFERENCES negocios(id_negocio) ON DELETE CASCADE
);

CREATE TABLE reservas (
    id_reserva           INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_usuario           INT UNSIGNED NOT NULL,
    id_mesa              INT UNSIGNED NOT NULL,
    fecha_reserva        DATE         NOT NULL,
    hora_reserva         TIME         NOT NULL,
    num_personas         INT          NOT NULL CHECK (num_personas > 0),
    estado               ENUM('pendiente','confirmada','cancelada') DEFAULT 'pendiente',
    fecha_creacion       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion    TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_mesa)    REFERENCES mesas(id_mesa)       ON DELETE CASCADE
);

CREATE TABLE resenias (
    id_resenia       INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_negocio       INT UNSIGNED NOT NULL,
    id_usuario       INT UNSIGNED NOT NULL,
    calificacion     TINYINT      NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    texto            TEXT,
    fecha            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_negocio) REFERENCES negocios(id_negocio) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_resenia (id_negocio, id_usuario)
);
