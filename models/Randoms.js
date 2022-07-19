const { fork } = require("child_process");

const get = (req, res) => {
    const max = (req.params.cant)?parseInt(req.params.cant):100000000;
    const childProcess = fork("./models/randomSobrecargado.js");
    childProcess.send(max);
    childProcess.on("message", function (data) {
        return res.send(data);
    });
}

module.exports = {
    get,
};