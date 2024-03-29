export const restaurants = [
    {name: 'Osteria Francescana', location: 'Italy'},
    {name: 'El Celler de Can Roca', location: 'Spain'},
    {name: 'Mirazur', location: 'France'},
    {name: 'Eleven Madison Park', location: 'New York City'},
    {name: 'Gaggan', location: 'Thailand'},
    {name: 'Central', location: 'Peru'},
    {name: 'Maido', location: 'Peru'},
    {name: 'Arpège', location: 'France'},
    {name: 'Mugaritz', location: 'Spain'},
    {name: 'Asador Etxebarri', location: 'Spain'},
    {name: 'Quintonil', location: 'Mexico'},
    {name: 'Blue Hill at Stone Barns', location: 'New York'},
    {name: 'Pujol', location: 'Mexico'},
    {name: 'Steirereck', location: 'Austria'},
    {name: 'White Rabbit', location: 'Russia'},
    {name: 'Piazza Duomo', location: 'Italy'},
    {name: 'Den', location: 'Japan'},
    {name: 'Disfrutar', location: 'Spain'},
    {name: 'Geranium', location: 'Denmark'},
    {name: 'Attica', location: 'Australia'},
    {name: 'Alain Ducasse au Plaza Athénée', location: 'France'},
    {name: 'Narisawa', location: 'Japan'},
    {name: 'Le Calandre', location: 'Italy'},
    {name: 'Ultraviolet', location: 'China'},
    {name: 'Cosme', location: 'New York City'},
    {name: 'Le Bernardin', location: 'New York City'},
    {name: 'Boragó', location: 'Chile'},
    {name: 'Odette', location: 'Singapore'},
    {name: 'Alléno Paris au Pavillon Ledoyen', location: 'France'},
    {name: 'D.O.M.', location: 'Brazil'},
    {name: 'Arzak', location: 'Spain'},
    {name: 'Tickets', location: 'Spain'},
    {name: 'The Clove Club', location: 'England'},
    {name: 'Alinea', location: 'Chicago'},
    {name: 'Maaemo', location: 'Norway'},
    {name: 'Reale', location: 'Italy'},
    {name: 'Restaurant Tim Raue', location: 'Germany'},
    {name: 'Lyle’s', location: 'England'},
    {name: 'Astrid y Gaston', location: 'Peru'},
    {name: 'Septime', location: 'France'},
    {name: 'Nihonryori RyuGin', location: 'Japan'},
    {name: 'The Ledbury', location: 'England'},
    {name: 'Azurmendi', location: 'Spain'},
    {name: 'Mikla', location: 'Turkey'},
    {name: 'Dinner by Heston Blumenthal', location: 'England'},
    {name: 'Saison', location: 'San Francisco'},
    {name: 'Schloss Schauenstein', location: 'Switzerland'},
    {name: 'Hiša Franko', location: 'Romania'},
    {name: 'Nahm', location: 'Thailand'},
    {name: 'The Test Kitchen', location: 'South Africa'}
].map(restaurant => ({
    label: `${restaurant.name} (${restaurant.location})`,
    value: restaurant.name
}));
