import React from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const RecallScreen = ({ route }) => {
    const { results } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Recall Results</Text>
            <FlatList
                data={results}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.title}>{item.product_description}</Text>
                        <Text>Recall Number: {item.recall_number}</Text>
                        <Text>Status: {item.status}</Text>
                        <Text>Recall Reason: {item.reason_for_recall}</Text>
                        <Text>Distribution: {item.distribution_pattern}</Text>
                        <Text>Classification: {item.classification}</Text>
                        <Text>Recall Initiation Date: {item.recall_initiation_date}</Text>
                    </View>
                )}
            />
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
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 5,
    },
    title: {
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
    // Additional styles
});

export default RecallScreen;
