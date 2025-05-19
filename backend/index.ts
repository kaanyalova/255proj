import { Database } from 'bun:sqlite';
import moment from 'moment';

type User = {
    id: string;
    name: string;
    surname: string;
    birth_date: number;
    bio: string;
    password: string;
};

export type NewUserForm = {
    name: string;
    surname: string;
    email: string;
    birth_date: string;
    profile_image: File;
    password: string;
};

const db = new Database('users.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT NOT NULL,
  birth_date INTEGER NOT NULL,
  bio TEXT,
  password TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Session (
  id TEXT NOT NULL,
  key TEXT NOT NULL
  )
  `);

Bun.serve({
    port: 11223,
    routes: {
        // List posts
        '/api/new_user': {
            POST: async (req) => {
                const formData = await req.formData();
                const newUserForm: NewUserForm = {
                    name: formData.get('name') as string,
                    surname: formData.get('surname') as string,
                    email: formData.get('email') as string,
                    birth_date: formData.get('birth_date') as string,
                    profile_image: formData.get('profile_image') as File,
                    password: formData.get('password') as string,
                };

                //console.log(formData);

                const userId = crypto.randomUUID();

                const dateInUnixMilis = moment(
                    newUserForm.birth_date,
                    'MMM DD, YYYY'
                ).unix();

                const hashed = await Bun.password.hash(newUserForm.password);

                const usersWithSameName = db
                    .query('SELECT * FROM User WHERE name = ? AND surname = ? ')
                    .all(newUserForm.name, newUserForm.surname);

                if (usersWithSameName.length > 0) {
                    return new Response('User already exists', {
                        status: 409,
                    });
                }

                const usersWithSameEmail = db
                    .query('SELECT * FROM User WHERE email = ?')
                    .all(newUserForm.email);

                if (usersWithSameName.length > 0) {
                    return new Response('User already exists', {
                        status: 409,
                    });
                }

                const bilkentEmailRegex = new RegExp(
                    '^[A-Za-z0-9._%+-]+@bilkent.edu.tr$'
                );

                if (!newUserForm.email.match(bilkentEmailRegex)) {
                    return new Response('You need an bilkent email to login', {
                        status: 401,
                    });
                }

                db.query(
                    'INSERT INTO User (id, name, surname, email, birth_date, password) VALUES (?, ?, ?, ?, ?, ?)'
                ).run(
                    userId,
                    newUserForm.name,
                    newUserForm.surname,
                    newUserForm.email,
                    dateInUnixMilis,
                    hashed
                );

                Bun.write(
                    `images/profiles/${userId}.png`,
                    newUserForm.profile_image
                );

                const cookies = req.cookies;
                cookies.set('self-id', userId);
                const token = crypto.randomUUID();

                db.query('INSERT INTO Session (id, key) VALUES (?, ?)').run(
                    userId,
                    token
                );

                cookies.set('token', token);

                return Response.redirect('/home');
            },
        },

        '/api/get_users/': {
            GET: () => {
                const users: Array<User> = db
                    .query(
                        'SELECT id, name, surname, birth_date, bio FROM User'
                    )
                    .all() as Array<User>;

                return Response.json(users);
            },
        },

        '/api/get_user_image/:id': {
            GET: async (req) => {
                const doesFileExist =
                    db
                        .query('SELECT id FROM USER WHERE User.id = ?')
                        .all(req.params.id).length > 0;

                if (doesFileExist) {
                    return new Response(
                        Bun.file(`images/profiles/${req.params.id}.png`)
                    );
                } else {
                    return new Response('File not found');
                }
            },
        },

        '/api/get_user/:id': {
            GET: async (req) => {
                const user: User = db
                    .query('SELECT * FROM User WHERE User.id = ?')
                    .get(req.params.id) as User;

                return Response.json(user);
            },
        },

        '/api/set_bio/:id': {
            POST: async (req) => {
                const json = await req.json();

                const token = req.cookies.get('token');
                if (!token) {
                    return new Response('Token not found');
                }

                const tokenFromDb = db
                    .query(
                        'SELECT * FROM Session WHERE Session.key = ? AND Session.id = ?'
                    )
                    .get(token, req.params.id);

                if (!tokenFromDb) {
                    return new Response('Invalid token');
                }

                db.query('UPDATE User SET bio = ? WHERE id = ?').run(
                    json.bio,
                    req.params.id
                );

                return new Response('Success');
            },
        },

        '/api/login': {
            POST: async (req) => {
                const formData = await req.formData();

                const email = formData.get('email') as string;
                const password = formData.get('password') as string;

                const user: User = db
                    .query('SELECT * FROM User WHERE email = ?')
                    .get(email) as User;

                const hashFromDB = user.password as string;

                const isCorrectPass = Bun.password.verify(password, hashFromDB);

                if (!isCorrectPass) {
                    return new Response('Wrong pass', { status: 401 });
                }

                const token = crypto.randomUUID();

                db.query('INSERT INTO Session (id, key) VALUES (?, ?)').run(
                    user.id,
                    token
                );

                req.cookies.set('self-id', user.id);
                req.cookies.set('token', token);
                return Response.redirect('/home');
            },
        },
    },

    error(error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    },
});
