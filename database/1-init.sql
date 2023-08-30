-- This script was generated by the ERD tool in pgAdmin 4.
-- Veuillez signaler tout problème à https://redmine.postgresql.org/projects/pgadmin4/issues/new si vous trouvez des erreurs. Préciser dans le rapport les étapes pour le reproduire.
BEGIN;


CREATE TABLE IF NOT EXISTS public.user_role
(
    user_id integer NOT NULL,
    role_role_id integer NOT NULL,
    CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role_role_id)
);

CREATE TABLE IF NOT EXISTS public.role
(
    role_id serial NOT NULL,
    role_name character varying(32) COLLATE pg_catalog."default" NOT NULL,
    role_description character varying(256) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT role_pkey PRIMARY KEY (role_id)
);

CREATE TABLE IF NOT EXISTS public."user"
(
    id serial NOT NULL,
    username character varying(32) COLLATE pg_catalog."default" NOT NULL,
    email character varying(128) COLLATE pg_catalog."default" NOT NULL,
    password character varying(72) COLLATE pg_catalog."default",
    first_name character varying(24) COLLATE pg_catalog."default",
    last_name character varying(24) COLLATE pg_catalog."default",
    phone character varying(24) COLLATE pg_catalog."default",
    CONSTRAINT user_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.following
(
    user_id integer NOT NULL,
    "user_id_following " integer NOT NULL,
    CONSTRAINT "following _pkey" PRIMARY KEY (user_id, "user_id_following ")
);

CREATE TABLE IF NOT EXISTS public.post
(
    user_id integer NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    text character varying(256) COLLATE pg_catalog."default",
    score bigint NOT NULL DEFAULT 0,
    post_parent_id integer,
    post_parent_created timestamp with time zone,
    CONSTRAINT post_pkey PRIMARY KEY (user_id, created)
);

CREATE TABLE IF NOT EXISTS public.vote
(
    user_id integer NOT NULL,
    post_user_id integer NOT NULL,
    post_created timestamp with time zone NOT NULL,
    positive boolean NOT NULL DEFAULT true,
    CONSTRAINT vote_pkey PRIMARY KEY (user_id, post_user_id, post_created)
);

CREATE TABLE IF NOT EXISTS public."authorization"
(
    user_id integer NOT NULL,
    acess_token_id smallint NOT NULL,
    acess_token_key character varying(128) NOT NULL,
    acess_token_expires timestamp with time zone NOT NULL,
    refresh_token character varying(128) NOT NULL,
    refresh_token_expires timestamp with time zone NOT NULL,
    PRIMARY KEY (user_id, acess_token_id)
);

ALTER TABLE IF EXISTS public.user_role
    ADD CONSTRAINT user_role_role_role_id_fkey FOREIGN KEY (role_role_id)
    REFERENCES public.role (role_id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public.user_role
    ADD CONSTRAINT user_role_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public.following
    ADD CONSTRAINT "following _user_id_fkey" FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public.following
    ADD CONSTRAINT "following _user_id_following _fkey" FOREIGN KEY ("user_id_following ")
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public.post
    ADD CONSTRAINT post_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public.vote
    ADD CONSTRAINT vote_post_user_id_post_created_fkey FOREIGN KEY (post_user_id, post_created)
    REFERENCES public.post (user_id, created) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public.vote
    ADD CONSTRAINT vote_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;


ALTER TABLE IF EXISTS public."authorization"
    ADD FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;

END;