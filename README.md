# cuRaven

A live chat for Carleton University. Anyone can watch the conversation, but only students with a valid Carleton email can post.

**[curaven.ca](https://www.curaven.ca)**

## Features

- **Carleton-only posting** — sign in with your Carleton email to send messages; anyone can read without an account.
- **Real-time messaging** — messages appear instantly for all users via WebSockets.
- **Persistent history** — chat history is stored in Supabase and loaded on arrival.

## Usage

Visit [curaven.ca](https://www.curaven.ca). No setup required to read. To post, sign in with your `@cmail.carleton.ca` or `@carleton.ca` email address.

## Self Hosting

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up a [Supabase](https://supabase.com) project and configure the required environment variables in a `.env.local` file.

3. Run the development server:

```bash
npm run dev
```

## License

This project is licensed under the [GPL-3.0](LICENSE.md)
GNU General Public License — see the [LICENSE.md](LICENSE.md) file for details.
