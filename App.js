const express = require("express");
const app = express();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Port = 5000;
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json()); //midilewhere

const userdb = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
const productDb = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
app.listen(Port, () => {
  console.log(`"Good" Your app is Runnig GOOD ${Port}`);
});
app.get("/", (req, res) => {
  res.send(userdb);
});
app.get("/cartProducts", (req, res) => {
  res.send(productDb.products);
});
app.post("/checkAuth", (req, res) => {
  checkAuth(req, res);
});
function isChecked({ name }) {
  return (
    productDb.products.findIndex((product) => product.name === name) !== -1
  );
}
app.post("/addToCart", (req, res) => {
  console.log("text+=+=+=+=+=+=", req.body);
  const { id, name, image, price_string, price_symbol, price } = req.body;
  if (isChecked({ name })) {
    const status = 401;
    const message = "Already Added To the Cart";
    res.status(status).json({ status, message });
    return;
  }
  fs.readFile("./data.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }
    data = JSON.parse(data.toString());
    data.products.push({
      id: id,
      name: name,
      image: image,
      price_string: price_string,
      price_symbol: price_symbol,
      price: price,
      quantity: 1,
    });
    let writeData = fs.writeFile(
      "./data.json",
      JSON.stringify(data),
      (err, result) => {
        if (err) {
          const status = 401;
          const message = err;
          res.status(status).json({ status, message });
        }
      }
    );
  });
  res.status(200).json(req.body);
});

app.delete("/removeCart", (req, res) => {
  console.log("text+==++==", req.body);
  const { name } = req.body;
  var removeProduct = name;
  var data = fs.readFileSync("data.json");
  var json = JSON.parse(data);
  var products = json.products;
  json.products = products.filter((product) => {
    return product.name !== removeProduct;
  });
  fs.writeFileSync("data.json", JSON.stringify(json, null, 2));
  const status = 200;
  const message = "Product Was Removed From Cart";
  res.status(status).json({ status, message });
});

function isAuthenticated({ userMail, userPassword }) {
  return (
    userdb.users.findIndex(
      (user) => user.userMail === userMail && user.userPassword === userPassword
    ) !== -1
  );
}

app.post("/register", (req, res) => {
  const { userMail, userPassword } = req.body;
  if (isAuthenticated({ userMail, userPassword })) {
    const status = 401;
    const message = "Email & Password already exist";
    res.status(status).json({ status, message });
    return;
  }
  fs.readFile("./db.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }
    data = JSON.parse(data.toString());
    let last_item_id = data.users[data.users.length - 1].id;
    data.users.push({
      id: last_item_id + 1,
      userMail: userMail,
      userPassword: userPassword,
    });
  });
  res.status(200).json(req.body);
});

app.post("/login", (req, res) => {
  const { userEmail, userPassword } = req.body;
  const data = userdb.users.find(
    (val) =>
      val.userMail === req.body.userEmail &&
      val.userPassword === req.body.userPassword
  );
  if (data === undefined) {
    res.status(400).json({
      status: 400,
      error: { msg: "Invalid credentials" },
    });
  } else {
    const Token = jwt.sign({ userEmail }, "hdhdhdhd", { expiresIn: "30m" });
    const refreshToken = jwt.sign({ userEmail }, "hdhdhdhd", {
      expiresIn: "1h",
    });
    console.log(Token, "get login token");
    res.status(200).json({
      status: "success",
      Token,
      refreshToken,
    });
  }
});
const checkAuth = (req, res, next) => {
  const { TokenExpiredError } = jwt;
  const catchError = (error, res) => {
    console.log("errorShow", error, res);
    if (error instanceof TokenExpiredError) {
      return res
        .status(401)
        .send({ Message: "Unauthorized! AccessToken was expired!" });
    }
    return res.status(401).send({ message: "Unauthorized!" });
  };
  const token = req.headers["x-access-token"];
  if (!token) {
    res.status(400).json({
      errors: [{ msg: " Token is not Found" }],
    });
  }
  jwt.verify(token, "hdhdhdhd", (error, decoded) => {
    console.log("decoces", decoded);
    if (error) {
      return catchError(error, res);
    }
  });
};
