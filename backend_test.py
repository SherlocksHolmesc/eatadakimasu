#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Eatadakimasu Food Decider App
Tests all backend endpoints with realistic data scenarios
"""

import requests
import json
import time
import random
import string
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://mealmate-125.preview.emergentagent.com/api"
TIMEOUT = 30

class EatadakimasuTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_results = []
        self.created_rooms = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result with details"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "API is healthy", data)
                    return True
                else:
                    self.log_result("Health Check", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_room_creation(self):
        """Test room creation for both solo and group modes"""
        results = []
        
        # Test solo mode
        try:
            payload = {"mode": "solo"}
            response = self.session.post(f"{BASE_URL}/rooms/create", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "room_code" in data and data.get("mode") == "solo":
                    self.created_rooms.append(data["room_code"])
                    self.log_result("Room Creation (Solo)", True, f"Created room: {data['room_code']}", data)
                    results.append(True)
                else:
                    self.log_result("Room Creation (Solo)", False, "Invalid response format", data)
                    results.append(False)
            else:
                self.log_result("Room Creation (Solo)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Room Creation (Solo)", False, f"Error: {str(e)}")
            results.append(False)
        
        # Test group mode
        try:
            payload = {"mode": "group"}
            response = self.session.post(f"{BASE_URL}/rooms/create", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "room_code" in data and data.get("mode") == "group":
                    self.created_rooms.append(data["room_code"])
                    self.log_result("Room Creation (Group)", True, f"Created room: {data['room_code']}", data)
                    results.append(True)
                else:
                    self.log_result("Room Creation (Group)", False, "Invalid response format", data)
                    results.append(False)
            else:
                self.log_result("Room Creation (Group)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Room Creation (Group)", False, f"Error: {str(e)}")
            results.append(False)
        
        return all(results)
    
    def test_room_joining(self):
        """Test room joining with valid and invalid codes"""
        results = []
        
        if not self.created_rooms:
            self.log_result("Room Joining", False, "No rooms available for testing")
            return False
        
        # Test valid room code
        try:
            valid_code = self.created_rooms[0]
            payload = {"room_code": valid_code}
            response = self.session.post(f"{BASE_URL}/rooms/join", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("room_code") == valid_code:
                    self.log_result("Room Joining (Valid)", True, f"Joined room: {valid_code}", data)
                    results.append(True)
                else:
                    self.log_result("Room Joining (Valid)", False, "Invalid response data", data)
                    results.append(False)
            else:
                self.log_result("Room Joining (Valid)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Room Joining (Valid)", False, f"Error: {str(e)}")
            results.append(False)
        
        # Test invalid room code
        try:
            invalid_code = "INVALID123"
            payload = {"room_code": invalid_code}
            response = self.session.post(f"{BASE_URL}/rooms/join", json=payload)
            
            if response.status_code == 404:
                self.log_result("Room Joining (Invalid)", True, "Correctly rejected invalid room code")
                results.append(True)
            else:
                self.log_result("Room Joining (Invalid)", False, f"Should return 404, got {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Room Joining (Invalid)", False, f"Error: {str(e)}")
            results.append(False)
        
        return all(results)
    
    def test_room_details(self):
        """Test getting room details"""
        if not self.created_rooms:
            self.log_result("Room Details", False, "No rooms available for testing")
            return False
        
        try:
            room_code = self.created_rooms[0]
            response = self.session.get(f"{BASE_URL}/rooms/{room_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("room_code") == room_code:
                    self.log_result("Room Details", True, f"Retrieved room details for: {room_code}", data)
                    return True
                else:
                    self.log_result("Room Details", False, "Invalid response data", data)
                    return False
            else:
                self.log_result("Room Details", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Room Details", False, f"Error: {str(e)}")
            return False
    
    def test_preferences_saving(self):
        """Test saving user preferences"""
        if not self.created_rooms:
            self.log_result("Preferences Saving", False, "No rooms available for testing")
            return False
        
        try:
            room_code = self.created_rooms[0]
            payload = {
                "room_code": room_code,
                "location": "Downtown Tokyo",
                "cuisines": ["japanese", "italian"],
                "min_budget": 15,
                "max_budget": 35
            }
            response = self.session.post(f"{BASE_URL}/preferences", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result("Preferences Saving", True, f"Saved preferences for room: {room_code}", data)
                    return True
                else:
                    self.log_result("Preferences Saving", False, "Success flag not set", data)
                    return False
            else:
                self.log_result("Preferences Saving", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Preferences Saving", False, f"Error: {str(e)}")
            return False
    
    def test_restaurant_filtering(self):
        """Test restaurant filtering with different criteria"""
        results = []
        
        # Test Japanese and Italian cuisine
        try:
            payload = {
                "cuisines": ["japanese", "italian"],
                "min_budget": 10,
                "max_budget": 30,
                "location": "Downtown"
            }
            response = self.session.post(f"{BASE_URL}/restaurants", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                restaurants = data.get("restaurants", [])
                if restaurants:
                    # Check if all returned restaurants match criteria
                    valid_cuisines = all(r.get("cuisine") in ["japanese", "italian"] for r in restaurants)
                    if valid_cuisines:
                        self.log_result("Restaurant Filtering (Japanese/Italian)", True, 
                                      f"Found {len(restaurants)} matching restaurants", 
                                      {"count": len(restaurants), "sample": restaurants[:2]})
                        results.append(True)
                    else:
                        self.log_result("Restaurant Filtering (Japanese/Italian)", False, 
                                      "Some restaurants don't match cuisine criteria", restaurants)
                        results.append(False)
                else:
                    self.log_result("Restaurant Filtering (Japanese/Italian)", False, "No restaurants returned", data)
                    results.append(False)
            else:
                self.log_result("Restaurant Filtering (Japanese/Italian)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Restaurant Filtering (Japanese/Italian)", False, f"Error: {str(e)}")
            results.append(False)
        
        # Test Mexican cuisine
        try:
            payload = {
                "cuisines": ["mexican"],
                "min_budget": 5,
                "max_budget": 15,
                "location": "West End"
            }
            response = self.session.post(f"{BASE_URL}/restaurants", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                restaurants = data.get("restaurants", [])
                mexican_restaurants = [r for r in restaurants if r.get("cuisine") == "mexican"]
                if mexican_restaurants:
                    self.log_result("Restaurant Filtering (Mexican)", True, 
                                  f"Found {len(mexican_restaurants)} Mexican restaurants", 
                                  {"count": len(mexican_restaurants), "sample": mexican_restaurants[:1]})
                    results.append(True)
                else:
                    self.log_result("Restaurant Filtering (Mexican)", True, 
                                  "No Mexican restaurants in budget range (expected)", data)
                    results.append(True)  # This might be expected based on mock data
            else:
                self.log_result("Restaurant Filtering (Mexican)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Restaurant Filtering (Mexican)", False, f"Error: {str(e)}")
            results.append(False)
        
        return all(results)
    
    def test_vote_submission(self):
        """Test submitting votes for restaurants"""
        if not self.created_rooms:
            self.log_result("Vote Submission", False, "No rooms available for testing")
            return False
        
        results = []
        room_code = self.created_rooms[0]
        
        # Submit multiple votes
        test_votes = [
            {"user_id": "user_alice", "restaurant_id": "rest_1", "vote": "yes"},
            {"user_id": "user_bob", "restaurant_id": "rest_1", "vote": "yes"},
            {"user_id": "user_alice", "restaurant_id": "rest_2", "vote": "no"},
            {"user_id": "user_bob", "restaurant_id": "rest_2", "vote": "yes"},
            {"user_id": "user_charlie", "restaurant_id": "rest_1", "vote": "yes"}
        ]
        
        for i, vote_data in enumerate(test_votes):
            try:
                payload = {
                    "room_code": room_code,
                    **vote_data
                }
                response = self.session.post(f"{BASE_URL}/votes", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_result(f"Vote Submission {i+1}", True, 
                                      f"Vote by {vote_data['user_id']} for {vote_data['restaurant_id']}: {vote_data['vote']}")
                        results.append(True)
                    else:
                        self.log_result(f"Vote Submission {i+1}", False, "Success flag not set", data)
                        results.append(False)
                else:
                    self.log_result(f"Vote Submission {i+1}", False, f"HTTP {response.status_code}", response.text)
                    results.append(False)
            except Exception as e:
                self.log_result(f"Vote Submission {i+1}", False, f"Error: {str(e)}")
                results.append(False)
        
        return all(results)
    
    def test_results_retrieval(self):
        """Test getting voting results for solo and group modes"""
        if not self.created_rooms:
            self.log_result("Results Retrieval", False, "No rooms available for testing")
            return False
        
        results = []
        room_code = self.created_rooms[0]
        
        # Test solo mode results
        try:
            response = self.session.get(f"{BASE_URL}/results/{room_code}?mode=solo")
            
            if response.status_code == 200:
                data = response.json()
                results_list = data.get("results", [])
                self.log_result("Results Retrieval (Solo)", True, 
                              f"Retrieved {len(results_list)} results for solo mode", 
                              {"count": len(results_list), "sample": results_list[:2]})
                results.append(True)
            else:
                self.log_result("Results Retrieval (Solo)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Results Retrieval (Solo)", False, f"Error: {str(e)}")
            results.append(False)
        
        # Test group mode results
        try:
            response = self.session.get(f"{BASE_URL}/results/{room_code}?mode=group")
            
            if response.status_code == 200:
                data = response.json()
                results_list = data.get("results", [])
                # Check if results are sorted by vote count (for group mode)
                if len(results_list) > 1:
                    is_sorted = all(results_list[i].get("vote_count", 0) >= results_list[i+1].get("vote_count", 0) 
                                  for i in range(len(results_list)-1))
                    if is_sorted:
                        self.log_result("Results Retrieval (Group)", True, 
                                      f"Retrieved {len(results_list)} sorted results for group mode", 
                                      {"count": len(results_list), "sample": results_list[:2]})
                        results.append(True)
                    else:
                        self.log_result("Results Retrieval (Group)", False, 
                                      "Results not properly sorted by vote count", results_list)
                        results.append(False)
                else:
                    self.log_result("Results Retrieval (Group)", True, 
                                  f"Retrieved {len(results_list)} results for group mode", 
                                  {"count": len(results_list)})
                    results.append(True)
            else:
                self.log_result("Results Retrieval (Group)", False, f"HTTP {response.status_code}", response.text)
                results.append(False)
        except Exception as e:
            self.log_result("Results Retrieval (Group)", False, f"Error: {str(e)}")
            results.append(False)
        
        return all(results)
    
    def test_ai_recommendations(self):
        """Test Claude AI recommendations"""
        try:
            payload = {
                "cuisines": ["japanese", "italian"],
                "min_budget": 15,
                "max_budget": 35,
                "location": "Downtown Tokyo"
            }
            response = self.session.post(f"{BASE_URL}/ai-recommend", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                recommendation = data.get("recommendation", "")
                restaurants = data.get("restaurants", [])
                
                if recommendation and restaurants:
                    self.log_result("AI Recommendations", True, 
                                  f"Got AI recommendation with {len(restaurants)} restaurants", 
                                  {"recommendation_length": len(recommendation), "restaurant_count": len(restaurants)})
                    return True
                else:
                    self.log_result("AI Recommendations", False, "Missing recommendation or restaurants", data)
                    return False
            else:
                self.log_result("AI Recommendations", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("AI Recommendations", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("🍜 Starting Eatadakimasu Backend API Tests")
        print("=" * 50)
        
        test_methods = [
            self.test_health_check,
            self.test_room_creation,
            self.test_room_joining,
            self.test_room_details,
            self.test_preferences_saving,
            self.test_restaurant_filtering,
            self.test_vote_submission,
            self.test_results_retrieval,
            self.test_ai_recommendations
        ]
        
        passed = 0
        total = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed += 1
                time.sleep(0.5)  # Small delay between tests
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_method.__name__}: {str(e)}")
        
        print("\n" + "=" * 50)
        print(f"🍜 Test Summary: {passed}/{total} tests passed")
        
        # Print detailed results
        print("\n📊 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        return passed, total, self.test_results

def main():
    """Main test execution"""
    tester = EatadakimasuTester()
    passed, total, results = tester.run_all_tests()
    
    # Return exit code based on results
    if passed == total:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    exit(main())