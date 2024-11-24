using System;
using Unity.MLAgents.Sensors;

namespace Unity.MLAgentsExamples
{
    /// <summary>
    /// A simple example of a SensorComponent.
    /// This should be added to the same GameObject as the SwallowController
    /// </summary>
    public class SwallowSensorComponent : SensorComponent
    {
        public SwallowController basicController;

        /// <summary>
        /// Creates a SwallowSensor.
        /// </summary>
        /// <returns>Corresponding sensors.</returns>
        public override ISensor[] CreateSensors()
        {
            return new ISensor[] { new SwallowSensor(basicController) };
        }
    }

    /// <summary>
    /// Simple Sensor implementation that uses a one-hot encoding of the Agent's
    /// position as the observation.
    /// </summary>
    public class SwallowSensor : SensorBase
    {
        public SwallowController basicController;

        public SwallowSensor(SwallowController controller)
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
            return ObservationSpec.Vector(SwallowController.k_Extents * SwallowController.k_Extents * SwallowController.k_Extents);
        }

        /// <inheritdoc/>
        public override string GetName()
        {
            return "Swallow";
        }

    }
}
