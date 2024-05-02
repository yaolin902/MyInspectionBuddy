import React, { useState } from 'react';
import { View, Text, TextInput, Dimensions, StyleSheet, TouchableOpacity} from 'react-native';
import  { Picker }  from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const MaudeScreen = () => {
  const [selectedYear, setSelectedYear] = useState('ALL YEARS');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MAUDE Recall Search</Text>
      
      <View style={styles.searchSection}>
        <TextInput style={styles.searchBar} placeholder="Search Bar" />
        <Picker
          selectedValue={selectedYear}
          style={styles.yearPicker}
          onValueChange={(itemValue, itemIndex) =>
            setSelectedYear(itemValue)
          }>
          <Picker.Item label="ALL YEARS" value="ALL YEARS" />
          <Picker.Item label="2024" value="2024" />
          <Picker.Item label="2023" value="2023" />
          <Picker.Item label="2022" value="2022" />
          <Picker.Item label="2021" value="2021" />
          <Picker.Item label="2020" value="2020" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.searchButton}>
        <Text>Search</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: 10,
    },
    title: {
      fontWeight: 'bold',
      fontSize: 30,
      marginBottom: 20,
    },
    searchBar: {
      borderWidth: 1,
      borderColor: 'black',
      paddingHorizontal: 100,
      padding: 10,
      width: '150%', // Adjust width as needed
      marginBottom: 50,
    },
    searchButton: {
      backgroundColor: '#ddd',
      paddingHorizontal: 40,
      paddingVertical: 10,
      borderRadius: 5,
      marginBottom: 20,
      marginTop: 10,
    },
    pickerContainer: {
      width: '100%', // Adjust width as needed
      flex: 1,
      justifyContent: 'space-between',
      height: 50,
      marginTop: 50,
    },
    yearPicker: {
      width: '200',
      height: 50,
    },
  });
  
  

export default MaudeScreen;
