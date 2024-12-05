//import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';


const { width } = Dimensions.get('window');

const AbbyScreen = () => {
    const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const onChangeFrom = (event, selectedDate) => {
    const currentDate = selectedDate || fromDate;
    setShowFromDatePicker(Platform.OS === 'ios' ? true : false);
    setFromDate(currentDate);
  };

  const onChangeTo = (event, selectedDate) => {
    const currentDate = selectedDate || toDate;
    setShowToDatePicker(Platform.OS === 'ios' ? true : false);
    setToDate(currentDate);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Abby's Page Recall Search</Text>
      
      {/* Form inputs and Search button */}
      <View style={styles.inputContainer}>
        <Text>Device Name:</Text>
        <TextInput style={styles.input} placeholder="Search Bar" />
        <Text>Firm Name:</Text>
        <TextInput style={styles.input} placeholder="Search Bar" />
      </View>

        <View style={styles.dateInputContainer}>
          <Text>Classified From Date:</Text>
          <Button title="Select Date" onPress={() => setShowFromDatePicker(true)} />
          {showFromDatePicker && (
            <DateTimePicker
              testID="dateTimePickerFrom"
              value={fromDate}
              mode="date"
              display="default"
              onChange={onChangeFrom}
            />
          )}
        </View>
        <View style={styles.dateInputContainer}>
          <Text>Classified To Date:</Text>
          <Button title="Select Date" onPress={() => setShowToDatePicker(true)} />
          {showToDatePicker && (
            <DateTimePicker
              testID="dateTimePickerTo"
              value={toDate}
              mode="date"
              display="default"
              onChange={onChangeTo}
            />
          )}
        </View>
      
      <Button title="Search" onPress={() => {/* Search logic */}} />
    </View>
    
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    marginBottom: 10,
  },
  dateInputContainer: {
    marginBottom: 10,
  },
  // Additional styles
});

export default AbbyScreen;
