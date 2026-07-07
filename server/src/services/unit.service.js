const unitRepository = require('../repositories/unit.repository');

// İşletmenin erişebildiği tüm birimleri döner (global + işletmeye özel).
async function listUnits(businessId) {
  return unitRepository.findAllForBusiness(businessId);
}

module.exports = {
  listUnits,
};
