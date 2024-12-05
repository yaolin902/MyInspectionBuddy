import React, { useState } from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// Mock data for SAP travel details
const mockTravelData = [
  {
    id: '1',
    destination: 'New York City',
    start_date: '2024-11-01',
    end_date: '2024-11-05',
    status: 'Confirmed',
    cost: '$1200'
  },
  {
    id: '2',
    destination: 'Los Angeles',
    start_date: '2024-12-10',
    end_date: '2024-12-15',
    status: 'Pending',
    cost: '$950'
  }
];

const SAPScreen = () => {
  const [trips] = useState(mockTravelData); // State to hold travel data

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAP Travel Information</Text>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>Destination: {item.destination}</Text>
            <Text>Start Date: {item.start_date}</Text>
            <Text>End Date: {item.end_date}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Cost: {item.cost}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  item: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  }
});

export default SAPScreen;
