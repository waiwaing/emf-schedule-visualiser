require "json"

def check_for_unique_ids(hash)
	size = hash.length
	unique_ids = hash.map { |t| t["id"] }.uniq.length

	raise "Conflicting IDs" if size != unique_ids
end

def check_minutes(hash)
	start = hash.map{ |t| t["start_time"][-2, 2] }
	ends = hash.map{ |t| t["end_time"][-2, 2] }

	mins = (start + ends).uniq

	# raise "oops mins" if mins.any? { |t| t.to_i % 5 != 0 }
end

def venues(hash)
	venues = hash.map { |t| t["venue"] }.uniq.sort
	p venues
end

def earliest_latest(hash)
	start = hash.map{ |t| t["start_time"] }.uniq.sort()
	ends = hash.map{ |t| t["end_time"] }.uniq.sort()

	p start
	p ends
end

def types(hash)
	p hash.map { |t| t["type"] }.uniq.sort()
end

def run
	file = File.read("schedule.json")
	hash = JSON.parse(file)

	check_for_unique_ids(hash)
	check_minutes(hash)
	venues(hash)
	earliest_latest(hash)
	types hash
end

run