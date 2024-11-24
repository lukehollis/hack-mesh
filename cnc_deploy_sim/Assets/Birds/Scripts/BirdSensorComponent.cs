using System;
using Unity.MLAgents.Sensors;

namespace Unity.MLAgentsExamples
{
    /// <summary>
    /// A simple example of a SensorComponent.
    /// This should be added to the same GameObject as the BirdController
    /// </summary>
    public class BirdSensorComponent : SensorComponent
    {
        public BirdController basicController;

        /// <summary>
        /// Creates a BirdSensor.
        /// </summary>
        /// <returns>Corresponding sensors.</returns>
        public override ISensor[] CreateSensors()
        {
            return new ISensor[] { new BirdSensor(basicController) };
        }
    }

    /// <summary>
    /// Simple Sensor implementation that uses a one-hot encoding of the Agent's
    /// position as the observation.
    /// </summary>
    public class BirdSensor : SensorBase
    {
        public BirdController basicController;

        public BirdSensor(BirdController controller)
        {
            basicController = controller;
        }

        /// <summary>
        /// Generate the observations for the sensor.
        /// In this case, the observations are all 0 except for a 1 at the position of the agent.
        /// </summary>
        /// <param name="output"></param>
        public override void WriteObservation(float[] output)
        {
            // One-hot encoding of the position
            Array.Clear(output, 0, output.Length);
            output[basicController.discretizedPosition] = 1;
        }

        /// <inheritdoc/>
        public override ObservationSpec GetObservationSpec()
        {
            return ObservationSpec.Vector(BirdController.k_Extents * BirdController.k_Extents * BirdController.k_Extents);
        }

        /// <inheritdoc/>
        public override string GetName()
        {
            return "Bird";
        }

    }
}
