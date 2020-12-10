const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

// req to github for data
async function getRepos(req, res, next) {
    try {
        console.log('Fetching Data...');
        let { username } = req.params;
        let response = await fetch(`https://api.github.com/users/${username}`);
        let data = await response.json()
        let public_repos = data.public_repos;

        // set data to redis
        client.setex(username, 1800, public_repos);

        res.send(setResponse(username, public_repos));

    } catch (err) {
        console.log(err);
        res.status(500);
    }
}

// set response
function setResponse(username, public_repos) {
    return `<h2>${username} has ${public_repos} Github repos</h2>`
}

// cache middleware
function cache(req, res, next) {
    let { username } = req.params;
    client.get(username, (err, data) => {
        if (err) throw err;
        if (data) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}

// routing
app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});