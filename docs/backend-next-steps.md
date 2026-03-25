# Siguientes pasos del backend

## 1. Crear proyecto en Supabase

En el panel de Supabase hay que:

1. Crear un proyecto nuevo.
2. Copiar `Project URL`.
3. Copiar `anon public key`.
4. Copiar `service_role key`.
5. Pegar esos valores en `.env`.

## 2. Ejecutar el esquema SQL

Copiar y ejecutar el contenido de [schema.sql](/Users/manuelmarquezhidalgo/Desktop/Proyecto/supabase/schema.sql) en el SQL Editor de Supabase.

Esto crea:

- `profiles`
- `portfolios`
- `portfolio_items`
- `favorites`

Además activa RLS para que cada usuario solo vea y modifique sus propios datos.

## 3. Verificar variables de entorno

Con el servidor arrancado, abrir:

- `/health`

Debe devolver `true` en las claves de Supabase si las variables están bien configuradas.

## 4. Próximo bloque de implementación

Cuando Supabase esté configurado, el siguiente paso es:

1. registro
2. login
3. middleware de autenticación
4. primera ruta protegida
5. CRUD de cartera
6. favoritos persistentes
