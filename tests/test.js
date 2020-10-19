const locator = require('../helpers/locator.js');

Feature('Test SQL table.');

/**
 *  Вывести все строки таблицы *Customers* и убедиться, что запись с ContactName
 *  равной 'Giovanni Rovelli' имеет Address = 'Via Ludovico il Moro 22'.
 */
Scenario('All rows from table **Customers* & ContactName = \'Giovanni Rovelli\'', async (I) => {
    I.amOnPage("/sql/trysql.asp?filename=trysql_select_all");
    let sql_script = "SELECT *\n" +
        "FROM Customers;";
    runSQLScript(sql_script);
    I.waitForElement(locator.tableBody, 5);

    let htm_arr = (await I.grabHTMLFrom(locator.tableBody)).match(/<tr>(.*?)<\/tr>/g);

    I.say("Form an array of column names");
    let columnName_arr = htm_arr[0].match(/<th>(.*?)<\/th>/g);
    let item_ContactName, item_Address, findStr;
    columnName_arr.forEach(function (str, i) {
        if (str.indexOf("ContactName") !== -1) {
            item_ContactName = i;
        }
        if (str.indexOf("Address") !== -1) {
            item_Address = i;
        }
    });
    if (!item_Address || !item_ContactName) {
        throw new Error("Can't find required columns in the table");
    }

    I.say("Looking for a substring in array of strings");
    let str_name = "Giovanni Rovelli";
    let str_address = "Via Ludovico il Moro 22";
    htm_arr.forEach(function (str, i) {
        if (str.indexOf(str_name) !== -1) {
            findStr = true;
            if (htm_arr[i].match(/<td>(.*?)<\/td>/g)[item_ContactName].indexOf(str_name) === -1 ||
                htm_arr[i].match(/<td>(.*?)<\/td>/g)[item_Address].indexOf(str_address) === -1) {
                throw new Error("ContactName '" + str_name + "' <> Address '" + str_address + "'");
            }
        }
    });
    if (!findStr) {
        throw new Error(" Can't find 'ContactName' = '" + str_name + "' in table");
    }
});


/**
 * Вывести только те строки таблицы *Customers*, где city='London'.
 * Проверить, что в таблице ровно 6 записей.
 */
Scenario("Rows = 'London'", async (I) => {
    I.amOnPage("/sql/trysql.asp?filename=trysql_select_all");
    let sql_script = "SELECT *\n" +
        "FROM Customers\n" +
        "WHERE City = 'London';";
    runSQLScript(sql_script);
    I.waitForElement(locator.tableBody, 5);

    I.see("Number of Records: 6", locator.resultNumberOfRecords_text);
    let htm_arr = (await I.grabHTMLFrom(locator.tableBody)).match(/<tr>(.*?)<\/tr>/g);
    if (htm_arr.length !== 7) {
        throw new Error("Incorrect count records in table. Expected 6 entries. Total count = " + (htm_arr.length - 1));
    }

    I.say("Check column 'City' in table");
    let columnName_arr = htm_arr[0].match(/<th>(.*?)<\/th>/g);
    let item_City;
    columnName_arr.forEach(function (str, i) {
        if (str.indexOf("City") !== -1) {
            item_City = i;
            htm_arr.splice(0, 1);
        }
    });
    if (!item_City) {
        throw new Error("Can't find required columns in the table");
    }

    I.say("Check City eque only 'London'");
    htm_arr.forEach(function (str, i) {
        if (htm_arr[i].match(/<td>(.*?)<\/td>/g)[item_City].indexOf("London") === -1) {
            throw new Error("City <> 'London'. Rows error = " + i);
        }
    });
});


/**
 *  Добавить новую запись в таблицу *Customers* и проверить, что эта запись добавилась.
 */
Scenario("Add new record. INSERT", async (I) => {
    I.amOnPage("/sql/trysql.asp?filename=trysql_select_all");
    let arr_value = ['Testing Customer', 'Wisebits Name', 'Street Wisebits', 'limassol', '3000', 'Cyprus']
    let sql_script = `INSERT INTO Customers('CustomerName', 'ContactName', 'Address', 'City', 'PostalCode', 'Country')\n` +
        `VALUES ('${arr_value[0]}', '${arr_value[1]}', '${arr_value[2]}', '${arr_value[3]}', '${arr_value[4]}', '${arr_value[5]}');`;
    runSQLScript(sql_script);
    I.waitForElement(locator.resultDatabaseChanges_text, 5);
    I.see("You have made changes to the database. Rows affected: 1", locator.resultDatabaseChanges_text);

    sql_script = "SELECT *\n" +
        "FROM Customers\n" +
        "WHERE City = 'limassol' AND ContactName = 'Wisebits Name';";
    runSQLScript(sql_script);
    I.waitForElement(locator.tableBody, 5);
    I.see("Number of Records: 1", locator.resultNumberOfRecords_text);

    I.say("Сheck the added record");
    let htm_arr = (await I.grabHTMLFrom(locator.tableBody)).match(/<tr>(.*?)<\/tr>/g);
    if (htm_arr.length !== 2) {
        throw new Error("Incorrect count records in table. Expected 1 entries. Total count = " + (htm_arr.length - 1));
    }

    arr_value.forEach(function (str, i) {
        if (htm_arr[1].match(/<td>(.*?)<\/td>/g)[i + 1].indexOf(arr_value[i]) === -1) {
            throw new Error("Added record error");
        }
    })
});


/**
 *   Обновить все поля (кроме CustomerID) в любой записи таблицы *Customers*и проверить, что изменения записались в базу.
 */
Scenario("UPDATE all fields.", async (I) => {
    I.amOnPage("/sql/trysql.asp?filename=trysql_select_all");
    let arr_value = ['Testing UPDATE', new Date().getTime(), 'Street UPDATE', 'limassol_update', '1', 'NEW']
    let sql_script = "UPDATE Customers\n" +
        `SET CustomerName = '${arr_value[0]}', ContactName = '${arr_value[1]}', Address = '${arr_value[2]}', City = '${arr_value[3]}', ` +
        ` PostalCode = '${arr_value[3]}', PostalCode = '${arr_value[4]}', Country = '${arr_value[5]}'\n` +
        "WHERE CustomerID = 13;";
    runSQLScript(sql_script);
    I.waitForElement(locator.resultDatabaseChanges_text, 5);
    I.see("You have made changes to the database. Rows affected: 1", locator.resultDatabaseChanges_text);
    sql_script = "SELECT *\n" +
        "FROM Customers\n" +
        "WHERE CustomerID = 13;";
    runSQLScript(sql_script);
    I.waitForElement(locator.tableBody, 5);
    I.see("Number of Records: 1", locator.resultNumberOfRecords_text);

    I.say("Сheck update fields");
    let htm_arr = (await I.grabHTMLFrom(locator.tableBody)).match(/<tr>(.*?)<\/tr>/g);
    if (htm_arr.length !== 2) {
        throw new Error("Incorrect count records in table. Expected 1 entries. Total count = " + (htm_arr.length - 1));
    }
    arr_value.forEach(function (str, i) {
        if (htm_arr[1].match(/<td>(.*?)<\/td>/g)[i + 1].indexOf(arr_value[i]) === -1) {
            throw new Error("Added record error");
        }
    })
});


/**   ТЕСТ ПАДАЕТ
 *    Вывести всех клиентов  и все заказы которые у них могут быть.
 *    Самая последный номер заказка в столцбуе будет с id = 10375
 */
Scenario("All Employees & Orders.", async (I) => {
    I.amOnPage("/sql/trysql.asp?filename=trysql_select_join_left");
    I.click(locator.sqlRun_button);
    I.waitForElement(locator.tableBody, 5);
    I.see("Number of Records: 213", locator.resultNumberOfRecords_text);

    let htm_arr = (await I.grabHTMLFrom(locator.tableBody)).match(/<tr>(.*?)<\/tr>/g);
    if (htm_arr.length !== 214) {
        throw new Error("Incorrect count records in table. Expected 213 entries. Total count = " + (htm_arr.length - 1));
    }
    let orders = ["Wolski ", "10375 "];
    if (htm_arr[htm_arr.length - 1].match(/<td>(.*?)<\/td>/g)[1].indexOf(orders[1]) === -1) {
        throw new Error("ERROR! OrderId <> 10375. Actual value = " + htm_arr[htm_arr.length - 1].match(/<td>(.*?)<\/td>/g)[1]);
    }

});

function runSQLScript(sql_script) {
    I = require('../steps_file.js')()
    I.click(locator.script_SELECT);
    I.pressKey(['Control', 'a']);
    I.pressKey('Backspace');
    sql_script.split('').forEach(function (item) {
        I.pressKey(item);
    });
    I.click(locator.sqlRun_button);
}