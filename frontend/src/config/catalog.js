export const FOOD_COMMODITIES = [
  "apples", "bananas", "beans_black", "cabbage", "carrots", "chickpeas",
  "eggs", "fish", "lentils_broken", "meat_chicken", "milk", "oil_mustard",
  "oil_soybean", "oranges", "peanut", "potatoes_red", "pumpkin", "rice_coarse",
  "rice_medium", "tomatoes", "wheat_flour",
]

export const MARKETS = [
  "kathmandu", "bhaktapur", "lalitpur", "pokhara", "chitwan",
  "butwal", "dharan", "biratnagar", "janakpur", "nepalgunj",
]

export const PROVINCES = [
  "bagmati", "province_1", "province_2", "gandaki", "lumbini", "karnali", "sudurpashchim",
]

export const displayCommodity = value => value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase())
