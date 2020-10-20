const assert = require('assert');
const { Client } = require('pg');
const { getDirectoryContents, getScriptOutput, getFileContents, canExecute } = require('./utils');

const connectionString = 'postgresql://postgres@localhost:5432/salon';
const client = new Client({
  connectionString: connectionString,
});

describe('SUBTASKS 1.1', async () => {
  async function cleanOldData() {
    // This function deletes data from the database that is created from the tests (hopefully)
    const existingColumns = await client.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_name = 'customers' OR table_name = 'services' OR table_name = 'appointments'`);

    const appointmentsCustomerId = existingColumns.rows.find(row => row.table_name == 'appointments' && row.column_name == 'customer_id');
    const appointmentsTime = existingColumns.rows.find(row => row.table_name == 'appointments' && row.column_name == 'time');
    const customersPhone = existingColumns.rows.find(row => row.table_name == 'customers' && row.column_name == 'phone');

    if (appointmentsCustomerId) {
      const customerIdRes = await client.query(`SELECT customer_id FROM customers WHERE phone='555-5555'`);

      if(customerIdRes.rows.length > 0) {
        await client.query(`DELETE FROM appointments WHERE customer_id=${customerIdRes.rows[0].customer_id}`);
      }  
    }

    if (appointmentsTime) {
      await client.query(`DELETE FROM appointments WHERE time='FakeTime'`);
    }

    if (customersPhone) {
      await client.query(`DELETE FROM customers WHERE phone='555-5555'`);
    }
  }

  before(async () => {
    try {
      await client.connect();
    } catch (error) {
      throw new Error('Cannot connect to PostgreSQL\n' + error);
    }
  });

  after(async () => {
    await cleanOldData();
    await client.end();
    console.log('client connection ended');
  });

  it(':1 "salon" database should exist', async () => {
    const query = 'SELECT datname FROM pg_database';
    const res = await client.query(query);

    if (!res) assert(false);

    const index = res.rows.findIndex(row => {
      return row.datname === 'salon';
    });

    assert(index >= 0);
  });

  it(':2 "customers", "appointments", and "services" tables should exist', async () => {
    const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    const res = await client.query(query);

    if (!res) assert(false);

    const customersIndex = res.rows.findIndex(row => {
      return row.table_name === 'customers';
    });

    const appointmentsIndex = res.rows.findIndex(row => {
      return row.table_name === 'appointments';
    });

    const servicesIndex = res.rows.findIndex(row => {
      return row.table_name === 'services';
    });

    assert(customersIndex >= 0 && appointmentsIndex >= 0 && servicesIndex >= 0);
  });

  it(':3 All tables should have a primary key that automatically increments', async () => {
    const queryPrimaryKeys = `SELECT c.column_name, c.ordinal_position FROM information_schema.key_column_usage AS c LEFT JOIN information_schema.table_constraints AS t ON t.constraint_name = c.constraint_name WHERE t.constraint_type = 'PRIMARY KEY'`;
    const queryTables = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    const queryColumns = `SELECT table_name, column_name, column_default FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = 'public'`;
    const primaryKeysRes = await client.query(queryPrimaryKeys);
    const columnsRes = await client.query(queryColumns);
    const tablesRes = await client.query(queryTables);

    if (!primaryKeysRes || !tablesRes) assert(false);

    const numberOfPrimaryKeys = primaryKeysRes.rows.length;
    const numberOfTables = tablesRes.rows.length;

    primaryKeysRes.rows.forEach(row => {
      const filteredCols = columnsRes.rows.filter(col => {
        return row.table_name === col.table_name && row.column_name === col.column_name;
      });

      if (filteredCols.column_default === null) assert(false);
    });

    assert(numberOfTables >= 1 && numberOfTables === numberOfPrimaryKeys);
  });

  it(':4 All primary keys should follow the suggested naming comvention', async () => {
    const queryPrimaryKeys = `SELECT c.table_name, c.column_name FROM information_schema.key_column_usage AS c LEFT JOIN information_schema.table_constraints AS t ON t.constraint_name = c.constraint_name WHERE t.constraint_type = 'PRIMARY KEY'`;
    const primaryKeysRes = await client.query(queryPrimaryKeys);

    if (!primaryKeysRes) assert(false);

    let columnName;
    primaryKeysRes.rows.forEach(row => {
      const tableName = row.table_name;

      if(tableName.endsWith('s') || tableName.endsWith('S')) {
        columnName = tableName.substring(0, tableName.length - 1) + '_id';
      } else {
        columnName = tableName + '_id';
      }

      if (columnName != row.column_name) assert(false);
    });

    assert(primaryKeysRes.rows.length > 0);
  });

  it(':5 Your "appointments" table should have the correct "customer_id" foreign key', async () => {
    const query = `SELECT tc.table_schema, tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE constraint_type = 'FOREIGN KEY';`;
    const foreignKeysRes = await client.query(query);

    if (!foreignKeysRes) assert(false);

    const columnIndex = foreignKeysRes.rows.findIndex(row => {
      return row.table_name === 'appointments' && row.column_name === 'customer_id' && row.foreign_table_name === 'customers' && row.foreign_column_name === 'customer_id';
    });

    assert(columnIndex >= 0);
  });

  it(':6 Your "appointments" table should have the correct "service_id" foreign key', async () => {
    const query = `SELECT tc.table_schema, tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE constraint_type = 'FOREIGN KEY';`;
    const foreignKeysRes = await client.query(query);

    if (!foreignKeysRes) assert(false);

    const columnIndex = foreignKeysRes.rows.findIndex(row => {
      return row.table_name === 'appointments' && row.column_name === 'service_id' && row.foreign_table_name === 'services' && row.foreign_column_name === 'service_id';
    });

    assert(columnIndex >= 0);
  });

  it(':7 Your "customers" table should have "phone" column that is a "VARCHAR" and must be unique', async () => {
    const queryUnique = `SELECT c.column_name FROM information_schema.key_column_usage AS c LEFT JOIN information_schema.table_constraints AS t ON t.constraint_name = c.constraint_name WHERE t.constraint_type = 'UNIQUE' AND c.table_name = 'customers' AND c.column_name = 'phone'`;
    const queryDataType = `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'phone' AND data_type = 'character varying'`;
    const uniqueRes = await client.query(queryUnique);
    const dataTypeRes = await client.query(queryDataType);

    assert(uniqueRes.rows.length > 0 && dataTypeRes.rows.length > 0);
  });

  it(':8 Your "services" and "customers" tables should have a "name" column', async () => {
    const queryColumns = `SELECT table_name, column_name, column_default FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = 'public'`;
    const columnsRes = await client.query(queryColumns);

    if (!columnsRes) assert(false);

    const columns = columnsRes.rows.filter(col => {
      return col.table_name === 'services' && col.column_name === 'name' || col.table_name === 'customers' && col.column_name === 'name';
    });

    assert(columns.length > 1);
  });

  it(':9 Your "appointments" table should have a "time" column that is a "VARCHAR"', async () => {
    const query = `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'time' AND data_type = 'character varying'`;
    const res = await client.query(query);

    assert(res.rows.length > 0);
  });

  it(':10 You should have at least three rows in your "services" table, one with a "service_id" of "1"', async () => {
    const query = `SELECT * FROM services`;
    const res = await client.query(query);
    const id1 = res.rows.find(row => row.service_id == 1);

    assert(res.rows.length >= 3 && id1);
  });

  it(':11 You should create a "salon.sh" file in the "project" folder', async () => {
    const projectDirectory = await getDirectoryContents('..');

    assert(projectDirectory.indexOf('salon.sh') >= 0);
  });

  it(':12 You should have the correct "shebang" at the top of your script', async () => {
    const scriptFile = await getFileContents('../salon.sh');

    assert(/^\s*#![ \t]*\/bin\/bash/.test(scriptFile));
  });

  it(':13 Your script file should have executable permissions', async () => {
    const executable = await canExecute('../salon.sh');

    assert(executable);
  });

  it(':14 You should not use the "clear" command in your script', async () => {
    const scriptFile = await getFileContents('../salon.sh');

    assert(!/clear/.test(scriptFile));
  });

  it(':15 You should display a list of services you offer', async () => {
    await cleanOldData();

    const scriptOutput = await getScriptOutput('../salon.sh', '1', '555-5555', 'Test', 'FakeTime');
    const query = `SELECT service_id, name FROM services`;
    const res = await client.query(query);
    const testArr = [];

    if (!res) assert(false);

    res.rows.forEach(row => {
      const id = row.service_id;
      const name = row.name;
      const re = new RegExp(id + '\\) ' + name, 'gi');

      testArr.push(re.test(scriptOutput));
    });

    assert(!testArr.includes(false) && res.rows.length > 0);
  });

  it(':16 You should display the list of services again if the entered service doesn\'t exist', async () => {
    await cleanOldData();

    const scriptOutput = await getScriptOutput('../salon.sh', 'BadInput', '1', '555-5555', 'Test', 'FakeTime');
    const query = `SELECT service_id, name FROM services`;
    const res = await client.query(query);

    if (!res) assert(false);

    res.rows.forEach(row => {
      const id = row.service_id;
      const name = row.name;
      const re = new RegExp(id + '\\) ' + name, 'gi');

      const match = scriptOutput.match(re);
      if(match.length < 2) {
        assert(false);
      }
    });

    assert(res.rows.length > 0);
  });

  it(':17 You should read input into the correct variables', async () => {
    const scriptFile = await getFileContents('../salon.sh');

    const test1 = /read[ \t]+SERVICE_ID_SELECTED/g.test(scriptFile);
    const test2 = /read[ \t]+CUSTOMER_PHONE/g.test(scriptFile);
    const test3 = /read[ \t]+CUSTOMER_NAME/g.test(scriptFile);
    const test4 = /read[ \t]+SERVICE_TIME/g.test(scriptFile);

    assert(test1 && test2 && test3 && test4);
  });

  it(':18 You should enter a new customer into the database if they don\'t exist', async () => {
    await cleanOldData();
    await getScriptOutput('../salon.sh', '1', '555-5555', 'Test', 'FakeTime');
    const query = `SELECT name FROM customers WHERE phone='555-5555'`;
    const res = await client.query(query);

    if (!res) assert(false);

    assert(res.rows.length > 0);
  });

  it(':19 You can add a new appointment by entering the suggested input at each prompt', async () => {
    await cleanOldData();
    await getScriptOutput('../salon.sh', '1', '555-5555', 'Test', 'FakeTime');
    const query = `SELECT * FROM appointments WHERE time='FakeTime'`;
    const res = await client.query(query);

    if (!res) assert(false);

    assert(res.rows.length > 0);
  });

  it(':20 You can create an appointment for an existing customer by entering the suggested input at each prompt', async () => {
    // This test relies on the previous test to create a new customer
    await getScriptOutput('../salon.sh', '1', '555-5555', 'FakeTime');
    const query = `SELECT * FROM appointments WHERE time='FakeTime'`;
    const res = await client.query(query);

    if (!res) assert(false);

    assert(res.rows.length > 0);
  });

  it(':21 You should display the suggested message after adding an new appointment', async () => {
    await cleanOldData();
    const scriptOutput = await getScriptOutput('../salon.sh', '1', '555-5555', 'Test', 'FakeTime');
    const nameOfServiceIdRes = await client.query(`SELECT name FROM services WHERE service_id=1`);

    if (!nameOfServiceIdRes) assert(false);

    const nameOfServiceId = nameOfServiceIdRes.rows[0].name;
    const re = new RegExp('I have put you down for a\\s+'+ nameOfServiceId + '\\s+at FakeTime, Test\\.', 'gi');

    assert(re.test(scriptOutput));
  });
});
