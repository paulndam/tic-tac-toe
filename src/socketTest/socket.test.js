import io from "socket.io-client";

describe("Socket.IO Player Events", () => {
  let socket;
  let playerOneId;
  let playerTwoId;
  let createdGameId;

  beforeAll((done) => {
    // connect to server before any tests run.
    socket = io("http://localhost:8080", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("==== creating test dummy player one =======");
      socket.emit("createPlayer", {
        name: "Dummy-Test-Socket-PlayerOne",
      });
      
    });

    socket.on("playerResponse", (response) => {
      console.log("=== Dummy Response ====");
      if (response.type === "playerCreated") {
        if (!playerOneId) {
          playerOneId = response.newPlayer.playerId;

          // create player two after player is created.
          socket.emit("createPlayer", { name: "Dummy-Test-Socket-PlayerTwo" });
        } else if (!playerTwoId) {
          playerTwoId = response.newPlayer.playerId;

          // Make playerOne create game.
          socket.emit("createGame", { playerId: playerOneId });
        }
      }
    });

    socket.on("gameResponse", (response) => {
      if (response.type === "gameCreated") {
        createdGameId = response.newGame.gameId;

        socket.emit("joinGame", {
          playerId: playerTwoId,
          gameId: createdGameId,
        });
      } else if (response.type === "gameJoined") {
        done();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Connection failed:", err);
      done();
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  });

  afterAll(() => {
    socket.close();
  });

  test("should successfully create a player", (done) => {
    // emit create player event.
    socket.emit("createPlayer", {
      name: "Test-Socket-Player-1",
    });

    socket.once("playerResponse", (response) => {
      console.log("=== Player response: ====", response);

      if(response.type === "error"){
        throw new Error(`Error creating test player: ${error.message}`)
      }

      if(response.type === "playerCreated"){
        expect(response).toHaveProperty("type", "playerCreated");
      expect(response).toHaveProperty("newPlayer");
      expect(response.newPlayer).toHaveProperty("name", "Test-Socket-Player-1");

      done();
      }
    });
  });

  test("should retrieve all players", (done) => {
    socket.emit("getAllPlayers", {});

    socket.once("playerResponse", (response) => {
      console.log("=== All Players Response ====", response);
      if (response.type === "error") {
        throw new Error(`Error: ${error.message}`);
      }

      if (response.type === "allPlayers") {
        expect(response).toHaveProperty("type", "allPlayers");
        expect(response).toHaveProperty("players");
        expect(Array.isArray(response.players)).toBe(true); // Check if we received an array
        done();
      }
    });
  }, 10000);

  test("should successfully create a game", (done) => {
    socket.emit("createGame", {
      playerId: playerOneId,
    });

    // Listen for the 'gameResponse' event from creating a game
    socket.once("gameResponse", (response) => {
      if (response.type === "gameCreated") {
        expect(response).toHaveProperty("type", "gameCreated");
        expect(response).toHaveProperty("newGame");
        // TO DO :Perform additional checks as necessary, e.g., game status or player assignments
        done(); // End this test once we've successfully created a game
      }
    });
  });

  test("should allow another player to join the game", (done) => {
    if (!createdGameId || !playerTwoId) {
      done("Game ID or Player ID is missing");
      return;
    }

    // Emit 'joinGame' event with player two ID and the game ID
    socket.emit("joinGame", { playerId: playerTwoId, gameId: createdGameId });

    // listen for the game response from the player joining the game.
    socket.on("gameResponse", (response) => {
      console.log("=== Joining game Response ====", response);

      if (response.type === "gameJoined") {
        expect(response).toHaveProperty("type", "gameJoined");
        expect(response).toHaveProperty("updateGame");
        expect(response.updateGame).toHaveProperty("gameId", createdGameId);
        expect(response.updateGame).toHaveProperty("playerTwoId", playerTwoId);
        // TO DO: Add additional checks if needed
        done();
      }
    });
  });

  test("should allow player one to make a move", (done) => {
    socket.emit("makeMove", {
      playerId: playerOneId,
      gameId: createdGameId,
      position: 0,
    });

    socket.once("gameMoveResponse", (response) => {
      console.log("make move game response ===>", response);

      if (response.type === "error") {
        throw new Error(`Error making move: ${response.message}`);
      }

      expect(response).toHaveProperty("type", "moveMade");

      let board = JSON.parse(response.gameStatus.board);
      // expect(response.gameStatus).toHaveProperty("board");
      expect(board[0]).toBe("X");
      done();
    });
  });

  test("should allow player two to make a move after player one", (done) => {
    socket.emit("makeMove", {
      playerId: playerTwoId,
      gameId: createdGameId,
      position: 1,
    });

    socket.once("gameMoveResponse", (response) => {
      if (response.type === "error") {
        throw new Error(`Error making move: ${response.message}`);
      }
      expect(response).toHaveProperty("type", "moveMade");
      expect(response).toHaveProperty("type", "moveMade");

      let board = JSON.parse(response.gameStatus.board);
      // expect(response.gameStatus).toHaveProperty("board");
      expect(board[1]).toBe("O");
      done();
    });
  });

  test("should successfully retrieve all games", (done) => {
    socket.emit("getAllGames", {});

    socket.once("gameResponse", (response) => {
      console.log("=== All Games Response ====", response);
      if (response.type === "error") {
        throw new Error(`Error: ${error.message}`);
      }

      expect(response).toHaveProperty("type", "allGames");
      expect(response).toHaveProperty("games");
      expect(Array.isArray(response.games)).toBe(true);
      done();
    });
  }, 20000);
});
