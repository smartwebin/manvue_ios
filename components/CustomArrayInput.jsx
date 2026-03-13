import theme from "@/theme";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const CustomArrayInput = ({
  label,
  data,
  setData,
  renderItem,
  required = false,
  defaultItem = {},
  errors = {},
  name = "", // e.g., "educationList"
}) => {
  const handleAdd = () => setData([...data, { ...defaultItem }]);

  const handleRemove = (index) => {
    const updated = [...data];
    updated.splice(index, 1);
    setData(updated);
  };

  // 🔹 helper to extract error for specific field
  const getFieldError = (index, field) => {
    const key = `${name}[${index}].${field}`;
    return errors[key];
  };

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      {label && (
        <View style={{ flexDirection: "row", marginBottom: theme.spacing.xs }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}
          >
            {label}
          </Text>
          {required && (
            <Text
              style={{
                color: theme.colors.status.error,
                fontSize: theme.typography.sizes.sm,
                marginLeft: 2,
              }}
            >
              *
            </Text>
          )}
        </View>
      )}

      {data.map((item, index) => (
        <View
          key={index}
          style={{
            marginBottom: theme.spacing.md,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          {renderItem(
            item,
            index,
            (field, value) => {
              const updated = [...data];
              updated[index][field] = value;
              setData(updated);
            },
            (field) => getFieldError(index, field) // ✅ returns error string
          )}

          {data.length > 1 && (
            <TouchableOpacity
              onPress={() => handleRemove(index)}
              style={{ marginTop: theme.spacing.sm }}
            >
              <Text style={{ color: theme.colors.status.error }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

export default CustomArrayInput;
