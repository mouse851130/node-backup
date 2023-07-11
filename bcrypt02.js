const bcrypt = require('bcryptjs')

const password = 'abc123'

const hash = '$2a$10$HBh9MkaiXzUgnBkx/7mUSu1Co5fXprJ/XA0e4XqRMVEpAChOe2aSW'

const result = bcrypt.compareSync(password,hash)

console.log(result) // boolean