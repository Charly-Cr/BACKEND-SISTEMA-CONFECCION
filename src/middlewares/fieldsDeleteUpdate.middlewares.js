const fieldsDeleteUpdate = (req, res, next) => {

  const fildsDelete = ['phone', 'password', 'role']

  fildsDelete.forEach((field) => {
    return delete req.body[field]
  })

  next()

}


module.exports = fieldsDeleteUpdate
